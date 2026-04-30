# CivicGuide: The Election Process Assistant

A smart, interactive web application that helps users understand the election process, timelines, and terminology, built for the Google Prompting War competition.

## 1. Chosen Vertical
**Civic Education / Government Services**

## 2. Approach and Logic
CivicGuide is designed to be highly accessible, interactive, and strictly nonpartisan. The architecture uses a custom-built Tab interface to separate concerns logically:
- **Timeline**: Uses an expandable accordion structure to break down complex election phases into digestible chunks without overwhelming the user.
- **Ask Anything (AI Chat)**: Connects directly to the Google Gemini API to provide instantaneous, neutral answers to complex civic questions. The system prompt forces the AI to remain educational and refuse political opinions.
- **Glossary**: Implements a real-time DOM-filtering search to allow users to quickly lookup confusing political jargon (like "gerrymandering" or "incumbent").

The design relies entirely on vanilla HTML, CSS, and JavaScript. We avoided CSS frameworks to ensure maximum performance and maintain complete control over the layout, transitions, and accessibility standards (ARIA labels).

## 3. How the Solution Works
1. **Landing**: The user is greeted by a clean, mobile-responsive hero section utilizing Navy Blue (`#185FA5`) and modern typography (Google Fonts 'Inter').
2. **Finding the Polling Station**: A direct CTA links the user to Google Maps with a pre-filled search for local polling stations.
3. **Exploring the Timeline**: The user clicks the "Timeline" tab and expands the phases of an election (from Candidate Declaration to Inauguration) to read the details.
4. **Asking Questions**: The user clicks the "Ask Anything" tab. They can either click a quick-suggestion chip or type their own question. The input is sanitized and sent to the Gemini API, which streams back an educational response.
5. **Looking up Terms**: The user clicks the "Glossary" tab and types into the search bar. The list of terms filters instantly based on the keystrokes.

## 4. Assumptions Made
- The application focuses on a general, high-level overview of the American democratic election process (Primaries, Electoral College, etc.), rather than a hyper-specific local or foreign election.
- The target audience reads English.
- The user has access to a modern browser that supports ES Modules (`type="module"`).

## 5. Google Services Used
- **Google Gemini API** (`@google/generative-ai`): Powers the "Ask Anything" chat assistant.
- **Google Fonts**: Provides the 'Inter' and 'Material Symbols' typography.
- **Google Maps**: Used in the main call-to-action button to help voters find their polling locations.

## 6. Setup Instructions
To run this project locally:

1. Clone or download the repository.
2. Rename `config.example.js` to `config.js`.
3. Obtain a Gemini API Key from Google AI Studio.
4. Open `config.js` and paste your API key:
   ```javascript
   export const GEMINI_API_KEY = "YOUR_REAL_API_KEY_HERE";
   ```
5. Start a local HTTP server in the project directory (required for ES modules to work without CORS errors). If you have Python installed, run:
   ```bash
   python -m http.server 8000
   ```
6. Open your browser and navigate to `http://localhost:8000`.

## 🔒 Security Notes
- **Never commit your real API keys to version control!** 
- The active `config.js` file is explicitly listed in the `.gitignore` to prevent accidental uploads to GitHub. Only `config.example.js` is tracked.

## ✅ Testing Checklist
- [x] Timeline phases expand and collapse correctly
- [x] Chat sends message and receives Gemini response
- [x] Glossary search filters in real time
- [x] Quick chips auto-fill the chat input
- [x] App works on mobile screen (375px width)
- [x] Error state shown if API key is missing or invalid
