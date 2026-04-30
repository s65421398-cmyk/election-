import { sanitizeHTML, filterGlossary, isValidChatMessage } from '../utils.js';

describe('Utility Functions Tests', () => {

    describe('sanitizeHTML', () => {
        it('should correctly escape HTML tags to prevent XSS', () => {
            const input = '<script>alert("hack")</script>';
            const expected = '&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;';
            expect(sanitizeHTML(input)).toBe(expected);
        });

        it('should handle empty or null inputs safely', () => {
            expect(sanitizeHTML(null)).toBe('');
            expect(sanitizeHTML(undefined)).toBe('');
            expect(sanitizeHTML('')).toBe('');
            expect(sanitizeHTML(123)).toBe(''); // Non-string
        });

        it('should correctly escape ampersands and quotes', () => {
            const input = 'This & That: "Quote" and \'Single\'';
            const expected = 'This &amp; That: &quot;Quote&quot; and &#039;Single&#039;';
            expect(sanitizeHTML(input)).toBe(expected);
        });
    });

    describe('filterGlossary', () => {
        const sampleData = [
            { term: 'Apple', definition: 'A red fruit' },
            { term: 'Banana', definition: 'A yellow fruit' },
            { term: 'Citrus', definition: 'An orange fruit' }
        ];

        it('should return matching terms (case-insensitive)', () => {
            const result = filterGlossary(sampleData, 'apple');
            expect(result.length).toBe(1);
            expect(result[0].term).toBe('Apple');
        });

        it('should match on definitions as well', () => {
            const result = filterGlossary(sampleData, 'yellow');
            expect(result.length).toBe(1);
            expect(result[0].term).toBe('Banana');
        });

        it('should return all data if query is empty', () => {
            const result = filterGlossary(sampleData, '');
            expect(result.length).toBe(3);
        });

        it('should handle empty or null datasets gracefully', () => {
            expect(filterGlossary(null, 'query')).toEqual([]);
            expect(filterGlossary([], 'query')).toEqual([]);
        });
        
        it('should handle whitespace in query', () => {
            const result = filterGlossary(sampleData, '   citrus   ');
            expect(result.length).toBe(1);
            expect(result[0].term).toBe('Citrus');
        });
    });

    describe('isValidChatMessage', () => {
        it('should return true for valid, typical messages', () => {
            expect(isValidChatMessage('Hello! How does voting work?')).toBe(true);
        });

        it('should return false for purely whitespace messages', () => {
            expect(isValidChatMessage('   ')).toBe(false);
            expect(isValidChatMessage('\n\t')).toBe(false);
        });

        it('should return false for empty strings', () => {
            expect(isValidChatMessage('')).toBe(false);
        });

        it('should return false for messages exceeding 500 characters', () => {
            const longString = 'A'.repeat(501);
            expect(isValidChatMessage(longString)).toBe(false);
        });

        it('should handle non-string inputs safely', () => {
            expect(isValidChatMessage(null)).toBe(false);
            expect(isValidChatMessage(undefined)).toBe(false);
            expect(isValidChatMessage(1234)).toBe(false);
        });
    });

});
