/**
 * @jest-environment jsdom
 */

import { sanitizeHTML, filterGlossary, isValidChatMessage } from '../utils.js';

// =====================================================================
// Tab Navigation Tests
// =====================================================================
describe('Tab Navigation UI Tests', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <nav aria-label="Main Navigation">
                <ul class="tab-list" role="tablist">
                    <li role="presentation"><button class="tab-btn" id="tab-timeline" role="tab" aria-selected="true" aria-controls="panel-timeline" tabindex="0">Timeline</button></li>
                    <li role="presentation"><button class="tab-btn" id="tab-chat" role="tab" aria-selected="false" aria-controls="panel-chat" tabindex="-1">Chat</button></li>
                    <li role="presentation"><button class="tab-btn" id="tab-glossary" role="tab" aria-selected="false" aria-controls="panel-glossary" tabindex="-1">Glossary</button></li>
                </ul>
            </nav>
            <div class="tab-content">
                <article id="panel-timeline" role="tabpanel" class="panel active"></article>
                <article id="panel-chat" role="tabpanel" class="panel hidden"></article>
                <article id="panel-glossary" role="tabpanel" class="panel hidden"></article>
            </div>
        `;
    });

    /**
     * Reusable switchTab function mirroring app.js logic.
     */
    function switchTab(selectedBtn, allBtns, allPanels) {
        allBtns.forEach(b => {
            b.setAttribute('aria-selected', 'false');
            b.setAttribute('tabindex', '-1');
        });
        allPanels.forEach(p => p.classList.add('hidden'));
        selectedBtn.setAttribute('aria-selected', 'true');
        selectedBtn.setAttribute('tabindex', '0');
        const panelId = selectedBtn.getAttribute('aria-controls');
        document.getElementById(panelId).classList.remove('hidden');
    }

    it('should switch to Chat tab and update ARIA attributes', () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel');
        const chatTab = document.getElementById('tab-chat');
        switchTab(chatTab, tabBtns, panels);

        expect(chatTab.getAttribute('aria-selected')).toBe('true');
        expect(chatTab.getAttribute('tabindex')).toBe('0');
        expect(document.getElementById('tab-timeline').getAttribute('aria-selected')).toBe('false');
        expect(document.getElementById('panel-chat').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('panel-timeline').classList.contains('hidden')).toBe(true);
    });

    it('should switch to Glossary tab and hide other panels', () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel');
        const glossaryTab = document.getElementById('tab-glossary');
        switchTab(glossaryTab, tabBtns, panels);

        expect(glossaryTab.getAttribute('aria-selected')).toBe('true');
        expect(document.getElementById('panel-glossary').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('panel-timeline').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('panel-chat').classList.contains('hidden')).toBe(true);
    });

    it('should only have one tab selected at a time', () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel');
        switchTab(document.getElementById('tab-chat'), tabBtns, panels);
        const selected = document.querySelectorAll('[aria-selected="true"]');
        expect(selected.length).toBe(1);
    });
});

// =====================================================================
// Timeline Rendering Tests
// =====================================================================
describe('Timeline Rendering Tests', () => {
    const timelineData = [
        { title: "Candidate Declaration", duration: "Spring", details: ["Announce run", "Form committee"] },
        { title: "Primary Elections", duration: "Jan - June", details: ["Vote for nominee"] }
    ];

    beforeEach(() => {
        document.body.innerHTML = `<div id="timeline-container"></div>`;
    });

    it('should render timeline items with correct content', () => {
        const container = document.getElementById('timeline-container');
        container.innerHTML = '';
        timelineData.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'timeline-item';
            const safeTitle = sanitizeHTML(item.title);
            const safeDuration = sanitizeHTML(item.duration);
            const detailsList = item.details.map(d => `<li>${sanitizeHTML(d)}</li>`).join('');
            itemEl.innerHTML = `
                <button class="timeline-btn" aria-expanded="${index === 0}" aria-controls="timeline-desc-${index}">
                    <div class="timeline-title"><span>${index + 1}. ${safeTitle}</span><span class="timeline-duration">${safeDuration}</span></div>
                    <div id="timeline-desc-${index}" class="timeline-content"><ul>${detailsList}</ul></div>
                </button>
            `;
            container.appendChild(itemEl);
        });

        const items = container.querySelectorAll('.timeline-item');
        expect(items.length).toBe(2);
        expect(items[0].textContent).toContain('Candidate Declaration');
        expect(items[1].textContent).toContain('Primary Elections');
    });

    it('should set first timeline item as expanded by default', () => {
        const container = document.getElementById('timeline-container');
        timelineData.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'timeline-item';
            itemEl.innerHTML = `<button class="timeline-btn" aria-expanded="${index === 0}"></button>`;
            container.appendChild(itemEl);
        });

        const buttons = container.querySelectorAll('.timeline-btn');
        expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
        expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
    });

    it('should toggle timeline item expansion on click', () => {
        const container = document.getElementById('timeline-container');
        const itemEl = document.createElement('div');
        itemEl.innerHTML = `<button class="timeline-btn" aria-expanded="false"></button>`;
        container.appendChild(itemEl);
        const btn = itemEl.querySelector('.timeline-btn');

        // Simulate toggle
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isExpanded);
        expect(btn.getAttribute('aria-expanded')).toBe('true');
    });
});

// =====================================================================
// Glossary Rendering & Search Tests
// =====================================================================
describe('Glossary Rendering and Search Tests', () => {
    const glossaryData = [
        { term: 'Ballot', definition: 'A device used to cast votes.' },
        { term: 'Electoral College', definition: 'A body of electors.' },
        { term: 'Gerrymandering', definition: 'Manipulating electoral boundaries.' }
    ];

    beforeEach(() => {
        document.body.innerHTML = `
            <input type="text" id="glossary-search" />
            <div class="glossary-list" id="glossary-list" role="list"></div>
        `;
    });

    function renderGlossaryList(data) {
        const list = document.getElementById('glossary-list');
        list.innerHTML = '';
        if (data.length === 0) {
            list.innerHTML = '<p class="text-muted">No terms found matching your search.</p>';
            return;
        }
        const sortedData = [...data].sort((a, b) => a.term.localeCompare(b.term));
        sortedData.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'glossary-item';
            itemEl.setAttribute('role', 'listitem');
            itemEl.innerHTML = `<h3>${sanitizeHTML(item.term)}</h3><p>${sanitizeHTML(item.definition)}</p>`;
            list.appendChild(itemEl);
        });
    }

    it('should render all glossary items sorted alphabetically', () => {
        renderGlossaryList(glossaryData);
        const items = document.querySelectorAll('.glossary-item');
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain('Ballot');
        expect(items[1].textContent).toContain('Electoral College');
        expect(items[2].textContent).toContain('Gerrymandering');
    });

    it('should display "no terms found" when data is empty', () => {
        renderGlossaryList([]);
        const list = document.getElementById('glossary-list');
        expect(list.textContent).toContain('No terms found');
    });

    it('should filter glossary based on search query', () => {
        const filtered = filterGlossary(glossaryData, 'ballot');
        renderGlossaryList(filtered);
        const items = document.querySelectorAll('.glossary-item');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Ballot');
    });

    it('should filter glossary by definition content', () => {
        const filtered = filterGlossary(glossaryData, 'boundaries');
        renderGlossaryList(filtered);
        const items = document.querySelectorAll('.glossary-item');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Gerrymandering');
    });

    it('should set role=listitem on each glossary item', () => {
        renderGlossaryList(glossaryData);
        const items = document.querySelectorAll('[role="listitem"]');
        expect(items.length).toBe(3);
    });
});

// =====================================================================
// Chat UI Helper Tests
// =====================================================================
describe('Chat UI Helper Tests', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="chat-history" id="chat-history" role="log" aria-live="polite"></div>
            <div id="error-banner" class="error-banner hidden" role="alert"></div>
            <input type="text" id="chat-input" />
            <button id="send-btn">Send</button>
            <button class="chip-btn">How does voting work?</button>
        `;
    });

    function appendMessageToUI(sender, text, container, isTyping = false) {
        const id = 'msg-' + Date.now();
        const msgEl = document.createElement('div');
        msgEl.className = `message ${sender}-message`;
        msgEl.id = id;
        const icon = sender === 'user' ? 'person' : 'smart_toy';
        const safeText = sanitizeHTML(text);
        msgEl.innerHTML = `
            <span class="material-symbols-outlined avatar" aria-hidden="true">${icon}</span>
            <div class="message-content ${isTyping ? 'typing' : ''}">${safeText}</div>
        `;
        container.appendChild(msgEl);
        return id;
    }

    function updateMessageInUI(id, text) {
        const msgEl = document.getElementById(id);
        if (msgEl) {
            const content = msgEl.querySelector('.message-content');
            let safeText = sanitizeHTML(text);
            safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            content.innerHTML = safeText;
            content.classList.remove('typing');
        }
    }

    function showError(message) {
        const banner = document.getElementById('error-banner');
        banner.textContent = message;
        banner.classList.remove('hidden');
    }

    function disableChat() {
        document.getElementById('chat-input').disabled = true;
        document.getElementById('send-btn').disabled = true;
        document.querySelectorAll('.chip-btn').forEach(btn => btn.disabled = true);
    }

    it('should append a user message to the chat history', () => {
        const container = document.getElementById('chat-history');
        const id = appendMessageToUI('user', 'Hello!', container);
        const msg = document.getElementById(id);
        expect(msg).not.toBeNull();
        expect(msg.classList.contains('user-message')).toBe(true);
        expect(msg.textContent).toContain('Hello!');
    });

    it('should append an AI message with typing indicator', () => {
        const container = document.getElementById('chat-history');
        const id = appendMessageToUI('ai', 'Thinking...', container, true);
        const msg = document.getElementById(id);
        expect(msg.classList.contains('ai-message')).toBe(true);
        expect(msg.querySelector('.typing')).not.toBeNull();
    });

    it('should update a message and remove typing class', () => {
        const container = document.getElementById('chat-history');
        const id = appendMessageToUI('ai', 'Thinking...', container, true);
        updateMessageInUI(id, 'The answer is 42.');
        const msg = document.getElementById(id);
        expect(msg.querySelector('.message-content').textContent).toContain('The answer is 42.');
        expect(msg.querySelector('.typing')).toBeNull();
    });

    it('should display error banner with correct message', () => {
        showError('API key is missing.');
        const banner = document.getElementById('error-banner');
        expect(banner.textContent).toBe('API key is missing.');
        expect(banner.classList.contains('hidden')).toBe(false);
    });

    it('should disable chat inputs on critical error', () => {
        disableChat();
        expect(document.getElementById('chat-input').disabled).toBe(true);
        expect(document.getElementById('send-btn').disabled).toBe(true);
        document.querySelectorAll('.chip-btn').forEach(btn => {
            expect(btn.disabled).toBe(true);
        });
    });

    it('should sanitize HTML in user messages to prevent XSS', () => {
        const container = document.getElementById('chat-history');
        const id = appendMessageToUI('user', '<script>alert("xss")</script>', container);
        const msg = document.getElementById(id);
        expect(msg.innerHTML).not.toContain('<script>');
        expect(msg.textContent).toContain('<script>');
    });

    it('should validate messages before sending', () => {
        expect(isValidChatMessage('How does voting work?')).toBe(true);
        expect(isValidChatMessage('')).toBe(false);
        expect(isValidChatMessage('   ')).toBe(false);
        expect(isValidChatMessage('A'.repeat(501))).toBe(false);
    });
});
