/**
 * Utilities for Election Process Assistant
 * Extracted as pure functions to enable comprehensive unit testing.
 */

/**
 * Prevents XSS by safely escaping HTML characters.
 * @param {string} str 
 * @returns {string} Escaped string
 */
export function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Filters the glossary array based on a query string.
 * @param {Array} data - Array of glossary objects {term, definition}
 * @param {string} query - The search string
 * @returns {Array} Filtered array
 */
export function filterGlossary(data, query) {
    if (!data || !Array.isArray(data)) return [];
    if (!query) return data;
    
    const lowerQuery = query.toLowerCase().trim();
    return data.filter(item => 
        (item.term && item.term.toLowerCase().includes(lowerQuery)) || 
        (item.definition && item.definition.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Validates a chat message to ensure it's not too long or completely empty.
 * @param {string} text 
 * @returns {boolean} True if valid
 */
export function isValidChatMessage(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= 500;
}
