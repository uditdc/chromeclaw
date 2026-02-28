# ChromeClaw

**Your AI Agent, Native in the Browser**

ChromeClaw is a Chrome extension that brings autonomous AI agent capabilities directly into the browser — no server, no terminal, no infrastructure. Install, add an API key, and start working.

Inspired by OpenClaw (190K+ GitHub stars), ChromeClaw solves its core adoption problem: requiring Node.js, a CLI daemon, and ongoing server maintenance. ChromeClaw runs entirely within Chrome's extension sandbox, making it accessible to any power user.

---

## MVP Features

1. **Side Panel Chat** — Persistent chat UI with streaming responses, conversation history, and multi-model switching
2. **Page Context Engine** — Content scripts automatically extract and structure page content for the LLM, with element targeting and multi-tab context
3. **Tool Calling & Agent Loop** — Full ReAct-style agent loop: reason → select tool → execute → observe → repeat
4. **Built-in Skills** — `page_reader`, `tab_manager`, `web_search`, `screenshot`, `clipboard`, `bookmark_manager`, `history_search`, `download`, `storage_inspector`, `notification`
5. **Skill Plugin System** — Sandboxed, permission-scoped plugin system for first-party, community, and user-authored skills
6. **Context Menu & Omnibox** — Right-click "Ask ChromeClaw" on any selection; type `cc ` in the address bar for quick commands
7. **Persistent Memory** — Extracts facts and preferences from conversations, stored locally in IndexedDB, injected into future system prompts

---

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Build Framework | [WXT](https://wxt.dev) (Web Extension Toolkit)    |
| UI              | React 19 + Tailwind CSS                           |
| State           | Zustand                                           |
| Local DB        | Dexie.js (IndexedDB)                              |
| LLM Client      | Vercel AI SDK (Anthropic, OpenAI, Google, Ollama) |
| Validation      | Zod                                               |
| Testing         | Vitest + Playwright                               |

---

## Project Status

**Planning phase.** No source code yet. Architecture and feature plans are documented in [`docs/`](./docs/).

- [`docs/PRD.md`](./docs/PRD.md) — Full product requirements document
- [`docs/plans/`](./docs/plans/) — Implementation plans for each MVP feature

---

## Development Progress

See [`docs/plans/00-index.md`](./docs/plans/00-index.md) for the build order and shared file architecture.
