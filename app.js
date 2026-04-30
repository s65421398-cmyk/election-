import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "./config.js";

/**
 * Election Process Assistant - Application Logic
 * Modular design separated into Setup, Tabs, Timeline, Glossary, and Chat logic.
 */

// --- Data Objects ---

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

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTimeline();
    initGlossary();
    initChat();
});

// --- Tab Navigation Logic ---

/**
 * Initializes accessible tab navigation.
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
 * Switches the active tab panel.
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

// --- Timeline Logic ---

/**
 * Renders the timeline array into the DOM.
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

// --- Glossary Logic ---

/**
 * Renders and handles search for the glossary.
 */
function initGlossary() {
    renderGlossaryList(glossaryData);

    const searchInput = document.getElementById('glossary-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = glossaryData.filter(item => 
            item.term.toLowerCase().includes(query) || 
            item.definition.toLowerCase().includes(query)
        );
        renderGlossaryList(filtered);
    });
}

/**
 * Renders a list of glossary items to the DOM.
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

// --- Chat Assistant Logic ---

let chatSession = null;

/**
 * Initializes Gemini and sets up event listeners for the chat interface.
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
    if (text.length > 500) {
        showError("Please keep your question under 500 characters.");
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

// --- Chat UI Helpers ---

/**
 * Appends a message bubble to the chat container.
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
 * Updates an existing message bubble with new content (used after fetching API response).
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
 * Displays an error message banner.
 */
function showError(message) {
    const banner = document.getElementById('error-banner');
    banner.textContent = message;
    banner.classList.remove('hidden');
}

/**
 * Disables chat inputs in case of critical error.
 */
function disableChat() {
    document.getElementById('chat-input').disabled = true;
    document.getElementById('send-btn').disabled = true;
    document.querySelectorAll('.chip-btn').forEach(btn => btn.disabled = true);
}

// --- Utilities ---

/**
 * Prevents XSS by escaping HTML entities.
 * @param {string} str 
 * @returns {string} Escaped string
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
