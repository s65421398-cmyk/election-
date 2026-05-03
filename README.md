# CivicGuide — Election Process Assistant

> A smart, interactive, AI-powered web application that helps citizens understand the election process, timelines, and terminology. Built for the **Google Prompting War** competition.

[![Automated Testing](https://github.com/s65421398-cmyk/election-/actions/workflows/test.yml/badge.svg)](https://github.com/s65421398-cmyk/election-/actions)

---

## 🌟 Features

### 📅 Interactive Election Timeline
- Visual, accordion-based walkthrough of all major election phases
- From **Candidate Declaration** through to **Inauguration Day**
- Fully accessible with keyboard navigation and ARIA attributes

### 🤖 Civic AI Assistant (Google Gemini)
- Powered by **Google Gemini 1.5 Flash** for real-time, conversational Q&A
- Nonpartisan, educational responses about elections, voting rights, and government
- Input validation, XSS sanitization, and graceful error handling

### 📖 Searchable Glossary
- 12+ key election terms with plain-language definitions
- Live, instant search filtering by term or definition
- Alphabetically sorted, accessible list with `role="listitem"`

### 🌐 Google Services Integration
- **Firebase Analytics** — Page view tracking and custom event logging
- **Google Translate Widget** — Multi-language accessibility for all users
- **Google Maps** — "Find Polling Station" link using Google Maps search

---

## 🏗️ Architecture & Code Quality

### Modular Design
```
├── index.html       # Semantic HTML5 with ARIA, resource hints, preloads
├── style.css        # CSS custom properties, animations, responsive design
├── app.js           # Core logic: Tabs, Timeline, Glossary, Chat (JSDoc'd)
├── utils.js         # Pure utility functions (sanitize, filter, validate)
├── config.js        # API key configuration (gitignored)
├── tests/
│   ├── utils.test.js    # Unit tests for all utility functions
│   └── app.test.js      # DOM/UI tests for tabs, timeline, glossary, chat
└── .github/workflows/
    └── test.yml         # CI/CD: Lint → Test (multi-node) → Build
```

### Testing Strategy
- **31 automated tests** across 2 test suites
- **100% code coverage** on utility functions (statements, branches, functions, lines)
- DOM testing with `jest-environment-jsdom` for UI component validation
- Tests cover: tab switching, timeline rendering, glossary search, chat UI, XSS prevention, error handling, accessibility attributes

### Performance Optimizations
- DNS prefetch & preconnect for all external origins
- Critical asset preloading (`style.css`, `app.js`, fonts)
- Deferred non-critical scripts
- Minification build step (`terser` for JS, `clean-css` for CSS)
- Skip-to-content link for screen reader users

### CI/CD Pipeline
- **Lint** → ESLint code quality checks
- **Test** → Jest with coverage (Node 18.x & 20.x matrix)
- **Build** → Asset minification with artifact size verification

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation
```bash
git clone https://github.com/s65421398-cmyk/election-.git
cd election-
npm install
```

### Configuration
Create a `config.js` file in the root:
```js
export const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
```

### Run Locally
Open `index.html` in a browser, or use a local server:
```bash
npx serve .
```

### Run Tests
```bash
npm test          # Run all tests with coverage
npm run lint      # Run ESLint code quality checks
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES Modules) |
| **AI** | Google Gemini 1.5 Flash via `@google/generative-ai` |
| **Analytics** | Firebase Analytics SDK |
| **i18n** | Google Translate Widget |
| **Maps** | Google Maps Search |
| **Testing** | Jest 30 + jsdom |
| **Linting** | ESLint 8 |
| **CI/CD** | GitHub Actions |
| **Fonts** | Google Fonts (Inter), Material Symbols |

---

## ♿ Accessibility

- Full WAI-ARIA compliance (tabs, roles, live regions)
- Keyboard navigation (Arrow keys for tabs)
- Focus-visible indicators on all interactive elements
- Skip-to-content link
- Screen-reader–friendly structure with semantic HTML5
- `aria-live="polite"` on chat history for dynamic content

---

## 📄 License

ISC © 2026 Civic Education Initiative
