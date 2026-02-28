# CHROMECLAW

**Your AI Agent, Native in the Browser**

---

_Product Requirements Document — Version 1.0 — February 2026_

_CONFIDENTIAL — For internal use only_

---

## 1. Executive Summary

ChromeClaw is a Chrome extension that brings the power of an autonomous AI agent directly into the browser. Inspired by OpenClaw, ChromeClaw eliminates the complexity of self-hosting, terminal setup, and server management by packaging the same agentic capabilities into a zero-setup Chrome extension.

Where OpenClaw requires a gateway server, Node.js runtime, and CLI onboarding, ChromeClaw installs in one click from the Chrome Web Store and is ready in seconds. The browser becomes both the interface and the execution environment — enabling page-aware AI assistance, cross-tab workflows, and tool-calling agents that operate natively where developers and power users already spend their time.

---

## 2. Problem Statement

OpenClaw proved massive demand for personal AI agents (190K+ GitHub stars, 2M visitors in one week). However, its adoption is bottlenecked by significant friction:

- **High setup complexity:** Requires Node.js 22+, CLI onboarding wizard, daemon installation, and ongoing server maintenance.
- **Security exposure:** 135,000+ instances found publicly exposed on the internet with default configurations. 17% of community skills flagged as malicious.
- **No native browser integration:** Browser automation requires a separate skill and headless browser setup. Page context is not natively available to the agent.
- **Developer-only audience:** The project's own maintainer warned it is "far too dangerous" for users who can't navigate a command line.

ChromeClaw solves this by shifting the runtime into the browser extension sandbox — a familiar, secure, zero-infrastructure environment that any power user can adopt.

---

## 3. Product Vision

> _For **developers, power users, and knowledge workers** who want a personal AI agent that acts on their behalf in the browser, **ChromeClaw** is a Chrome extension that provides autonomous, tool-calling AI assistance with native page awareness — without requiring a server, terminal, or any infrastructure._

**Core Principles:**

1. **Zero infrastructure:** Install from Chrome Web Store. Add an API key. Done.
2. **Browser-native:** The page you're viewing IS the context. No bridging, no scraping setup.
3. **Agentic:** Not a chatbot — an agent. It calls tools, chains actions, and executes multi-step workflows.
4. **Extensible:** Plugin/skill system for community and first-party capabilities.
5. **Secure by default:** Runs in Chrome's extension sandbox. No open ports. No public exposure.

---

## 4. Target Audience

### 4.1 Primary: Developers

- Full-stack and frontend developers who live in the browser
- DevOps engineers who manage cloud consoles (AWS, GCP, Azure) through web UIs
- Developers who want AI assistance but find OpenClaw's setup overhead too high
- Open-source contributors and tinkerers who want to build and share skills

### 4.2 Secondary: Power Users

- Product managers, designers, and analysts who work across many web tools
- Researchers who need to synthesize information across multiple sources
- Productivity enthusiasts who automate repetitive browser-based workflows

---

## 5. Technical Architecture

### 5.1 Extension Components

| Component                      | Role                                                                        | Chrome API                                    |
| ------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------- |
| Service Worker (background.js) | Agent gateway: session management, LLM API calls, tool routing, message bus | chrome.runtime, chrome.alarms, chrome.storage |
| Side Panel                     | Primary chat UI, streaming responses, skill output rendering                | chrome.sidePanel                              |
| Content Scripts                | Page context extraction, DOM interaction, form filling, element selection   | DOM APIs, chrome.runtime messaging            |
| Options Page                   | Configuration: API keys, model selection, skill management, preferences     | chrome.storage.sync                           |
| Context Menu                   | Right-click actions: "Ask AI about this", "Summarize selection"             | chrome.contextMenus                           |
| Omnibox                        | Quick commands via address bar: "cc: summarize this page"                   | chrome.omnibox                                |

### 5.2 Data Architecture

| Store                | Technology                 | Contents                                                            |
| -------------------- | -------------------------- | ------------------------------------------------------------------- |
| Conversation History | IndexedDB (via Dexie.js)   | Full message threads, tool call logs, timestamps                    |
| User Profile         | chrome.storage.sync        | API keys, model preferences, active skills (synced across devices)  |
| Skill Registry       | IndexedDB                  | Installed skills, metadata, execution logs                          |
| Memory               | IndexedDB                  | Semantic memory: extracted facts, user preferences, project context |
| Page Cache           | In-memory (service worker) | Recent page extractions for context continuity                      |

### 5.3 LLM Integration

ChromeClaw is model-agnostic with a bring-your-own-key architecture. Supported providers:

- **Anthropic Claude:** claude-sonnet-4-5-20250929, claude-opus-4-5-20250918 (primary recommended)
- **OpenAI:** gpt-4o, gpt-4.1, o3-mini
- **Google:** gemini-2.0-flash, gemini-2.5-pro
- **Local via Ollama:** Connect to localhost:11434 for fully private, zero-cost inference
- **OpenRouter:** Single API key for access to 100+ models

All LLM calls are made from the service worker to avoid CORS issues. Streaming is handled via ReadableStream for real-time token display in the side panel.

---

## 6. Core Features (MVP)

### 6.1 Intelligent Side Panel Chat

The primary interface. A persistent side panel that provides always-available AI assistance with streaming responses, conversation threading, and rich output rendering (markdown, code blocks, tables, images).

- Streaming token-by-token response display
- Conversation history with search and filtering
- Multi-model switching mid-conversation
- Export conversations as Markdown or JSON
- Keyboard shortcut to toggle (Ctrl+Shift+L / Cmd+Shift+L)

### 6.2 Page Context Engine

The core differentiator. Content scripts automatically extract and structure page content, providing the LLM with rich, real-time browser context that OpenClaw cannot match without a separate browser automation skill.

- **Automatic extraction:** Readable content, metadata, structured data (tables, lists, code blocks)
- **Smart truncation:** Intelligent chunking to stay within token limits while preserving key content
- **Element targeting:** User can click elements to add specific DOM nodes to context
- **Multi-tab context:** Pull context from multiple open tabs simultaneously
- **Screenshot capture:** Visual context via chrome.tabs.captureVisibleTab for vision-capable models

### 6.3 Tool Calling and Agent Loop

ChromeClaw implements a full ReAct-style agent loop: the LLM reasons about the task, selects tools, executes them, observes results, and continues until the goal is met or the user intervenes.

- Tool definitions injected into system prompt as function schemas
- Automatic tool execution with user confirmation for destructive actions
- Multi-step chaining: tool results feed back into the LLM for next action
- Configurable autonomy levels: full auto, confirm-each, manual-only
- Timeout and retry handling for long-running tool calls

### 6.4 Built-in Skills (MVP)

| Skill             | Description                                      | Chrome APIs Used               |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| page_reader       | Extract and summarize current page content       | Content script DOM access      |
| tab_manager       | Open, close, search, group, reorder tabs         | chrome.tabs, chrome.tabGroups  |
| web_search        | Search the web and return structured results     | fetch() from service worker    |
| screenshot        | Capture visible tab as image                     | chrome.tabs.captureVisibleTab  |
| clipboard         | Read/write clipboard content                     | navigator.clipboard API        |
| bookmark_manager  | Search, create, organize bookmarks               | chrome.bookmarks               |
| history_search    | Search browsing history with filters             | chrome.history                 |
| download          | Trigger and manage file downloads                | chrome.downloads               |
| storage_inspector | Read cookies and localStorage for current domain | chrome.cookies, content script |
| notification      | Send desktop notifications                       | chrome.notifications           |

### 6.5 Skill Plugin System

A modular, sandboxed plugin system that allows first-party, community, and user-authored skills to extend ChromeClaw's capabilities.

Each skill is a self-contained module exporting a name, description (used for LLM tool selection), a JSON Schema for parameters, and an async execute function. Skills receive a BrowserContext object providing safe access to tab info, page content, and storage — but never raw chrome.\* APIs.

```typescript
interface Skill {
	name: string
	description: string
	parameters: JSONSchema
	permissions: SkillPermission[]
	execute: (params: any, context: BrowserContext) => Promise<SkillResult>
}
```

- **Sandboxed execution:** Skills run in an isolated context. No direct access to chrome.\* APIs — they interact through a controlled BrowserContext interface.
- **Manifest declaration:** Each skill declares its required permissions. Users approve permissions at install time.
- **Skill store (v2):** Community-submitted skills with review, ratings, and verified publisher badges.

### 6.6 Context Menu and Omnibox

Quick-access entry points that reduce friction for common actions:

- **Context menu:** Right-click selected text → "Ask ChromeClaw", "Summarize", "Translate", "Explain code"
- **Omnibox:** Type "cc " in the address bar to send quick commands: "cc summarize this page", "cc find all emails on this page"

### 6.7 Persistent Memory

A lightweight semantic memory system that gives ChromeClaw continuity across sessions:

- Automatic extraction of user preferences, project names, and key facts from conversations
- Memory stored locally in IndexedDB — never sent to external servers
- Memory injection into system prompt for personalized, context-aware responses
- User can view, edit, and delete memories via the options page
- Optional: vector embedding for semantic recall (using a local embedding model or API)

---

## 7. Advanced Features (Post-MVP)

### 7.1 Cross-Tab Workflows

Multi-tab orchestration for complex, multi-step tasks:

- "Find the cheapest flight on Google Flights, then check my Google Calendar for conflicts"
- "Read this GitHub issue, find the relevant code in the repo, and draft a PR description"
- "Compare pricing across these three competitor pages and create a summary table"

### 7.2 Page Monitoring and Alerts

Background monitoring using chrome.alarms for time-sensitive awareness:

- Price drop alerts on product pages
- Job listing monitors on career sites
- Content change detection on any URL
- Periodic summarization of news feeds or dashboards

### 7.3 Inline AI Assistance (Skip v1)

Content script injection that provides AI assistance directly inside text fields on any website:

- Auto-complete suggestions in text areas (Gmail compose, Slack message box, GitHub comment)
- Slash commands inside any input: /summarize, /translate, /rewrite
- Grammar and tone checking overlay

### 7.4 Voice Interface (Skip v1)

Web Speech API integration for hands-free operation:

- Push-to-talk via keyboard shortcut
- Wake word detection (optional, using local speech recognition)
- Text-to-speech for responses using SpeechSynthesis or ElevenLabs API

### 7.5 Multi-Agent Routing

Specialized agents for different domains, inspired by OpenClaw's multi-agent workspaces:

- **Coding Agent:** Optimized for GitHub, Stack Overflow, documentation sites
- **Research Agent:** Optimized for academic papers, Wikipedia, data sources
- **Productivity Agent:** Optimized for Gmail, Calendar, project management tools
- **Custom agents:** User-defined system prompts and skill sets per domain

### 7.6 Webhook and Automation Triggers

- chrome.alarms for scheduled tasks (daily summaries, periodic checks)
- Page load triggers: auto-execute skills when visiting specific URLs
- Tab event triggers: actions on tab create, close, or URL change
- External webhook receiver via optional companion server (opt-in)

---

## 8. Technical Constraints and Mitigations

| Constraint                            | Impact                                                  | Mitigation                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| MV3 service worker 5-min idle timeout | Background state is lost when the worker sleeps         | Persist all state to IndexedDB/chrome.storage. Use chrome.alarms for periodic wakeups. Re-hydrate on activation.             |
| No eval() or dynamic code execution   | Cannot load skills as arbitrary JS strings              | Skills are statically bundled or loaded as ES modules from trusted sources. Sandboxed iframe execution for community skills. |
| Content Security Policy restrictions  | Limited script injection in extension pages             | All UI rendering uses framework (React). No inline scripts or styles.                                                        |
| Token limits for page context         | Large pages exceed LLM context windows                  | Smart truncation: extract readable content, remove boilerplate, chunk into segments. Send only relevant chunks.              |
| No raw TCP/UDP sockets                | Cannot connect to arbitrary services like OpenClaw does | Use fetch() for HTTP-based APIs. WebSocket for real-time connections. Ollama connects via HTTP.                              |
| Chrome Web Store review process       | Updates require review (1-3 days)                       | Skill system decouples functionality from extension updates. Core extension updates are infrequent.                          |

---

## 9. Security Model

ChromeClaw's security posture is significantly stronger than OpenClaw by design:

- **No open ports:** Unlike OpenClaw (which binds to 0.0.0.0 by default), ChromeClaw runs entirely within Chrome's process sandbox.
- **No server exposure:** No gateway, no daemon, no network listener. Attack surface is limited to the extension's declared permissions.
- **Permission-scoped skills:** Skills declare required permissions upfront. Users grant permissions explicitly. Skills cannot access APIs beyond their declared scope.
- **API key isolation:** Keys stored in chrome.storage.sync (encrypted by Chrome). Never accessible to content scripts or skills.
- **Content script isolation:** Content scripts run in an isolated world. Page scripts cannot access extension internals.
- **Skill sandboxing:** Community skills execute in a sandboxed iframe with a restricted API surface. No direct chrome.\* access.

---

## 10. Recommended Tech Stack

| Layer             | Technology                  | Rationale                                                                                 |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Build Framework   | WXT (Web Extension Toolkit) | Best-in-class DX for MV3 extensions. HMR, auto-manifest, multi-browser support.           |
| UI Framework      | React 19                    | Largest ecosystem, excellent extension support, concurrent rendering for streaming.       |
| Styling           | Tailwind CSS                | Rapid UI development, consistent design system, small bundle size with purging.           |
| State Management  | Zustand                     | Lightweight, works across extension contexts (popup, background, content script).         |
| Local Database    | Dexie.js (IndexedDB)        | Best IndexedDB wrapper. Reactive queries, versioned schema migrations.                    |
| LLM Client        | Vercel AI SDK               | Unified interface for multiple LLM providers. Streaming, tool calling, structured output. |
| Schema Validation | Zod                         | Runtime validation for skill parameters, API responses, and stored data.                  |
| Testing           | Vitest + Playwright         | Unit testing + E2E testing for extension flows.                                           |
| Bundler           | Vite (via WXT)              | Fast builds, tree-shaking, code splitting for extension chunks.                           |

---

## 11. Development Milestones

### Phase 1: Foundation (Weeks 1–2)

1. Scaffold project with WXT + React + Tailwind
2. Implement side panel chat UI with streaming response rendering
3. Wire up single LLM provider (Anthropic Claude) with API key configuration
4. Basic service worker message routing between side panel and content scripts
5. Content script for page text extraction (readability-based)
6. chrome.storage persistence for settings and conversation history

### Phase 2: Agent Core (Weeks 3–4)

1. Implement ReAct agent loop with tool calling
2. Build 5 core skills: page_reader, tab_manager, web_search, screenshot, clipboard
3. Context menu integration ("Ask ChromeClaw" on text selection)
4. Omnibox quick commands
5. Multi-model support (OpenAI, Google, Ollama)
6. Conversation history with IndexedDB via Dexie.js

### Phase 3: Intelligence (Weeks 5–6)

1. Skill plugin system with sandboxed execution
2. Persistent memory system (fact extraction, preference learning)
3. Multi-tab context aggregation
4. Remaining MVP skills: bookmarks, history, downloads, storage inspector, notifications
5. Settings sync across devices via chrome.storage.sync

### Phase 4: Polish and Launch (Weeks 7–8)

1. UI polish: onboarding flow, keyboard shortcuts, accessibility
2. Performance optimization: lazy loading, chunk splitting, memory management
3. Security audit: permission review, skill sandboxing hardening
4. Chrome Web Store submission: listing, screenshots, video, privacy policy
5. Documentation: user guide, skill development guide, API reference
6. Beta launch to developer communities

---

## 12. Success Metrics

| Metric                            | Target (3 months) | Target (6 months) |
| --------------------------------- | ----------------- | ----------------- |
| Chrome Web Store installs         | 5,000             | 25,000            |
| Weekly active users               | 2,000             | 10,000            |
| Average session length            | > 5 minutes       | > 8 minutes       |
| Skills executed per user per week | > 10              | > 25              |
| Community skills published        | 20                | 100               |
| Chrome Web Store rating           | > 4.5 stars       | > 4.5 stars       |
| Crash-free sessions               | > 99.5%           | > 99.8%           |

---

## 13. Competitive Landscape

| Feature                   | ChromeClaw            | OpenClaw               | ChatGPT Extension | Sider AI     |
| ------------------------- | --------------------- | ---------------------- | ----------------- | ------------ |
| Setup complexity          | One-click install     | CLI + server + daemon  | One-click         | One-click    |
| Browser-native context    | Full DOM access       | Requires browser skill | Limited           | Limited      |
| Tool calling / agent loop | Yes (ReAct)           | Yes (full agent)       | No                | No           |
| Skill/plugin system       | Yes (sandboxed)       | Yes (ClawHub)          | No                | No           |
| Model agnostic            | Yes (BYOK)            | Yes (BYOK)             | GPT only          | Multiple     |
| Local model support       | Yes (Ollama)          | Yes (Ollama)           | No                | No           |
| Multi-channel             | Browser only          | 15+ channels           | Browser only      | Browser only |
| Self-hosted / private     | Yes (local extension) | Yes (local server)     | No (cloud)        | No (cloud)   |
| Cross-tab workflows       | Native                | Via browser skill      | No                | No           |
| Open source               | Yes                   | Yes                    | No                | No           |

---

## 14. Risks and Mitigations

| Risk                                                   | Likelihood | Impact | Mitigation                                                                                                                     |
| ------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Chrome MV3 API limitations restrict agent capabilities | Medium     | High   | Design skill system to gracefully degrade. Maintain a capability matrix. Advocate for API improvements via Chrome bug tracker. |
| Chrome Web Store rejection or slow review              | Medium     | Medium | Follow all CWS policies strictly. Maintain sideload/dev mode install path for power users.                                     |
| Malicious community skills (same issue as OpenClaw)    | High       | High   | Sandboxed iframe execution. Permission declarations. Code review for featured skills. User ratings and reporting.              |
| LLM API costs deter adoption                           | Medium     | Medium | Prominent Ollama/local model support. Usage tracking dashboard. Smart caching to reduce redundant calls.                       |
| Prompt injection via page content                      | High       | Medium | Clearly delineate page content in system prompt. Content sanitization. User confirmation for destructive actions.              |
| Service worker lifecycle causes state loss             | High       | Low    | All state persisted to IndexedDB. Idempotent operations. Graceful recovery on worker restart.                                  |

---

## 15. Open Questions

1. Should ChromeClaw support Firefox/Safari via WXT's cross-browser support from day one, or focus exclusively on Chrome for MVP?
2. What is the monetization model? Options: fully open source (donations/sponsors), freemium (paid skill store), or Pro tier (hosted proxy for simpler onboarding).
3. Should community skills be distributed via a centralized store (with review) or decentralized (GitHub repos, npm packages)?
4. How aggressive should the agent's default autonomy level be? Full auto risks user trust; manual-only reduces the "magic" factor.
5. Should ChromeClaw integrate with OpenClaw's ecosystem (shared skills, compatible formats) or build an independent ecosystem?

---

_End of Document_
