import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "./config.js";
import { sanitizeHTML, filterGlossary, isValidChatMessage } from "./utils.js";

/**
 * @fileoverview Election Process Assistant — Application Logic.
 * 
 * This module provides the core interactive functionality for the CivicGuide
 * Election Process Assistant web application. It is organized into clearly
 * separated concerns:
 * 
 * 1. **Data Layer** — Static election timeline & glossary datasets.
 * 2. **Tab Navigation** — Accessible, keyboard-navigable tab switching.
 * 3. **Timeline Renderer** — Accordion-based election phase explorer.
 * 4. **Glossary Renderer** — Searchable, alphabetically sorted term list.
 * 5. **Chat Assistant** — Google Gemini-powered Q&A interface.
 * 
 * All user-facing text is sanitized via {@link sanitizeHTML} to prevent XSS.
 * 
 * @module app
 * @requires @google/generative-ai
 * @requires ./config.js
 * @requires ./utils.js
 */

// =====================================================================
// Data Layer — Static Datasets
// =====================================================================

/**
 * Timeline data representing the major phases of a U.S. general election.
 * Each entry contains a title, approximate duration, and bullet-point details.
 * @type {Array<{title: string, duration: string, details: string[]}>}
 */

const timelineData = [
    {
        title: "Candidate Declaration",
        duration: "Spring - Summer (Year prior)",
        details: [
            "Candidates publicly announce their intention to run for office.",
            "Form exploratory committees to test the waters.",
            "Begin fundraising and campaigning efforts."
        ]
    },
    {
        title: "Primary Elections & Caucuses",
        duration: "Jan - June (Election year)",
        details: [
            "Voters choose their party's nominee for the general election.",
            "Primaries use secret ballots; caucuses are local gatherings to decide.",
            "Delegates are awarded based on results to represent the candidate at national conventions."
        ]
    },
    {
        title: "National Conventions",
        duration: "July - August",
        details: [
            "Parties officially nominate their candidates for President and Vice President.",
            "The party platform (core values and policy goals) is finalized and adopted.",
            "Marks the start of the general election campaign."
        ]
    },
    {
        title: "General Election Campaign",
        duration: "August - November",
        details: [
            "Nominees campaign nationwide, focusing on swing states.",
            "Presidential and Vice-Presidential debates occur.",
            "Voter registration drives and early voting periods begin in many states."
        ]
    },
    {
        title: "Election Day",
        duration: "First Tuesday after Nov 1",
        details: [
            "Registered voters cast their ballots nationwide.",
            "Millions of votes are counted across the country.",
            "News outlets project winners based on exit polls and early returns."
        ]
    },
    {
        title: "Electoral College & Inauguration",
        duration: "December - January",
        details: [
            "Electors meet in their states in December to formally cast their votes.",
            "Congress counts the electoral votes in early January.",
            "The President-elect is inaugurated on January 20th, officially taking office."
        ]
    }
];

/**
 * Glossary of commonly used election and civic terminology.
 * Each entry maps a term to its plain-language definition.
 * @type {Array<{term: string, definition: string}>}
 */
const glossaryData = [
    { term: "Ballot", definition: "A device (paper or electronic) used to cast votes in an election." },
    { term: "Electoral College", definition: "A body of people representing the states of the US, who formally cast votes for the election of the president and vice president." },
    { term: "Constituency", definition: "A body of voters in a specified area who elect a representative to a legislative body." },
    { term: "Gerrymandering", definition: "Manipulating the boundaries of an electoral constituency so as to favor one party or class." },
    { term: "Incumbent", definition: "The current holder of a political office." },
    { term: "Runoff", definition: "A further election or race after a tie or inconclusive result in the initial one." },
    { term: "Swing State", definition: "A US state where the two major political parties have similar levels of support among voters, viewed as important in determining the overall result of a presidential election." },
    { term: "Turnout", definition: "The percentage of eligible voters who cast a ballot in an election." },
    { term: "Mandate", definition: "The authority granted by a constituency to act as its representative." },
    { term: "Proportional Representation", definition: "An electoral system in which parties gain seats in proportion to the number of votes cast for them." },
    { term: "Exit Poll", definition: "A poll of people leaving a polling place, asking how they voted." },
    { term: "Primary Election", definition: "An election to appoint delegates to a party conference or to select the candidates for a principal, especially presidential, election." }
];

// =====================================================================
// Initialization — Bootstrap on DOMContentLoaded
// =====================================================================

/**
 * Entry point. Initializes all interactive modules once the DOM is ready.
 * Execution order matters: Tabs → Timeline → Glossary → Chat.
 */
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTimeline();
    initGlossary();
    initChat();
});

// =====================================================================
// Tab Navigation Logic
// =====================================================================

/**
 * Sets up accessible tab navigation with click and keyboard (ArrowLeft/Right)
 * handlers. Conforms to WAI-ARIA Tabs pattern.
 * @returns {void}
 */
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn, tabBtns, panels));
        
        // Keyboard navigation (Arrow keys)
        btn.addEventListener('keydown', (e) => {
            let index = Array.from(tabBtns).indexOf(btn);
            if (e.key === 'ArrowRight') {
                index = (index + 1) % tabBtns.length;
                tabBtns[index].focus();
            } else if (e.key === 'ArrowLeft') {
                index = (index - 1 + tabBtns.length) % tabBtns.length;
                tabBtns[index].focus();
            }
        });
    });
}

/**
 * Switches the active tab panel, updating ARIA attributes and visibility.
 * @param {HTMLElement} selectedBtn - The tab button that was activated.
 * @param {NodeList} allBtns - All tab buttons in the tablist.
 * @param {NodeList} allPanels - All corresponding tab panels.
 * @returns {void}
 */
function switchTab(selectedBtn, allBtns, allPanels) {
    // Deselect all
    allBtns.forEach(b => {
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
    });
    allPanels.forEach(p => p.classList.add('hidden'));

    // Select target
    selectedBtn.setAttribute('aria-selected', 'true');
    selectedBtn.setAttribute('tabindex', '0');
    
    const panelId = selectedBtn.getAttribute('aria-controls');
    document.getElementById(panelId).classList.remove('hidden');
}

// =====================================================================
// Timeline Logic
// =====================================================================

/**
 * Renders the {@link timelineData} array into an accordion-style UI inside
 * the `#timeline-container` element. The first phase is expanded by default.
 * Each phase button toggles its own expanded state while collapsing others.
 * @returns {void}
 */
function initTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; // Clear fallback

    timelineData.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'timeline-item';
        
        // Sanitize data before injecting
        const safeTitle = sanitizeHTML(item.title);
        const safeDuration = sanitizeHTML(item.duration);
        const detailsList = item.details.map(d => `<li>${sanitizeHTML(d)}</li>`).join('');
        
        const isFirst = index === 0;

        itemEl.innerHTML = `
            <button class="timeline-btn" aria-expanded="${isFirst}" aria-controls="timeline-desc-${index}">
                <div class="timeline-title">
                    <span>${index + 1}. ${safeTitle}</span>
                    <span class="timeline-duration">${safeDuration}</span>
                </div>
                <div id="timeline-desc-${index}" class="timeline-content">
                    <ul>${detailsList}</ul>
                </div>
            </button>
            <div class="timeline-marker" aria-hidden="true"></div>
        `;

        const btn = itemEl.querySelector('.timeline-btn');
        btn.addEventListener('click', () => {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            
            // Close all others
            document.querySelectorAll('.timeline-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
            
            // Toggle current
            btn.setAttribute('aria-expanded', !isExpanded);
        });

        container.appendChild(itemEl);
    });
}

// =====================================================================
// Glossary Logic
// =====================================================================

/**
 * Initializes the glossary panel by rendering all terms and attaching
 * a live-search listener to the `#glossary-search` input.
 * @returns {void}
 */
function initGlossary() {
    renderGlossaryList(glossaryData);

    const searchInput = document.getElementById('glossary-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = filterGlossary(glossaryData, query);
        renderGlossaryList(filtered);
    });
}

/**
 * Renders a filtered/sorted list of glossary items into `#glossary-list`.
 * Shows a "no terms found" message if the array is empty.
 * @param {Array<{term: string, definition: string}>} data - Glossary entries to render.
 * @returns {void}
 */
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
        
        itemEl.innerHTML = `
            <h3>${sanitizeHTML(item.term)}</h3>
            <p>${sanitizeHTML(item.definition)}</p>
        `;
        list.appendChild(itemEl);
    });
}

// =====================================================================
// Chat Assistant Logic (Google Gemini Integration)
// =====================================================================

/**
 * Active Gemini chat session. `null` until successfully initialized.
 * @type {?Object}
 */
let chatSession = null;

/**
 * Initializes the Google Gemini chat session and binds event listeners
 * to the chat form and suggestion chip buttons. Falls back gracefully
 * if the API key is missing or invalid.
 * @returns {void}
 */
function initChat() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const chips = document.querySelectorAll('.chip-btn');

    // Attempt to initialize API
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE" || GEMINI_API_KEY === "") {
            showError("API Key is missing. Please configure config.js with a valid Gemini API Key.");
            disableChat();
            return;
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are a friendly, nonpartisan civic education assistant. Help users understand how elections work — processes, timelines, terminology, and voter rights. Keep answers concise (2-4 sentences), factual, and accessible to anyone regardless of education level. Never express political opinions or favor any party or candidate."
        });
        
        chatSession = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 500 }
        });
    } catch (error) {
        console.error("Initialization Error:", error);
        showError("Failed to initialize the AI Assistant. Check console for details.");
        disableChat();
    }

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        
        input.value = '';
        await handleChatMessage(text);
    });

    // Handle Quick Chips
    chips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const text = chip.textContent;
            await handleChatMessage(text);
        });
    });
}

/**
 * Processes a message, updates UI, and fetches response from Gemini.
 * @param {string} text - The user's input string
 */
async function handleChatMessage(text) {
    if (!chatSession) return;
    const chatHistory = document.getElementById('chat-history');
    const errorBanner = document.getElementById('error-banner');
    
    // Hide any previous errors
    errorBanner.classList.add('hidden');

    // 1. Validate Input
    if (!isValidChatMessage(text)) {
        showError("Please enter a valid question under 500 characters.");
        return;
    }

    // 2. Add user message to UI
    appendMessageToUI('user', text, chatHistory);

    // 3. Add loading indicator
    const typingId = appendMessageToUI('ai', 'Thinking...', chatHistory, true);
    
    // 4. Fetch Response
    try {
        const result = await chatSession.sendMessage(text);
        const responseText = result.response.text();
        
        updateMessageInUI(typingId, responseText);
    } catch (error) {
        console.error("API Error:", error);
        updateMessageInUI(typingId, "Sorry, I encountered an error. Please try again later.");
        showError("Error communicating with AI. Ensure your API key is valid.");
    }
}

// =====================================================================
// Chat UI Helpers
// =====================================================================

/**
 * Creates and appends a message bubble to the chat container.
 * @param {'user'|'ai'} sender - Identifies who sent the message.
 * @param {string} text - The message content (will be sanitized).
 * @param {HTMLElement} container - The chat history container element.
 * @param {boolean} [isTyping=false] - If true, applies a "typing" CSS class.
 * @returns {string} The auto-generated DOM id of the new message element.
 */
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
    container.scrollTop = container.scrollHeight;
    
    return id;
}

/**
 * Replaces the content of an existing message bubble. Used to swap the
 * "Thinking..." placeholder with the actual API response. Also performs
 * lightweight Markdown-to-HTML conversion for bold text (`**...**`).
 * @param {string} id - The DOM id of the message element to update.
 * @param {string} text - The new message content.
 * @returns {void}
 */
function updateMessageInUI(id, text) {
    const msgEl = document.getElementById(id);
    if (msgEl) {
        const content = msgEl.querySelector('.message-content');
        // We do basic formatting: bolding asterisks. 
        // We sanitize first, then safely replace double asterisks with <strong>
        let safeText = sanitizeHTML(text);
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        content.innerHTML = safeText;
        content.classList.remove('typing');
        msgEl.parentElement.scrollTop = msgEl.parentElement.scrollHeight;
    }
}

/**
 * Displays a non-blocking error banner to the user inside the chat panel.
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showError(message) {
    const banner = document.getElementById('error-banner');
    banner.textContent = message;
    banner.classList.remove('hidden');
}

/**
 * Disables all chat input controls (text field, send button, and suggestion
 * chips) in case of a critical initialization error.
 * @returns {void}
 */
function disableChat() {
    document.getElementById('chat-input').disabled = true;
    document.getElementById('send-btn').disabled = true;
    document.querySelectorAll('.chip-btn').forEach(btn => btn.disabled = true);
}


