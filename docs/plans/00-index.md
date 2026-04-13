# ChromeClaw — Core Feature Plans Index

Implementation plans for all 7 MVP core features (PRD Section 6).

## Build Order

Features have dependencies — build in this order:

| #   | Feature                     | Plan                                                             | Depends On |
| --- | --------------------------- | ---------------------------------------------------------------- | ---------- |
| 1   | Intelligent Side Panel Chat | [01-side-panel-chat.md](./01-side-panel-chat.md)                 | —          |
| 1.5 | Onboarding & Options Page   | [01.5-onboarding-and-options-page.md](./01.5-onboarding-and-options-page.md) | 6.1        |
| 2   | Page Context Engine         | [02-page-context-engine.md](./02-page-context-engine.md)         | 6.1        |
| 3   | Tool Calling & Agent Loop   | [03-tool-calling-agent-loop.md](./03-tool-calling-agent-loop.md) | 6.1        |
| 4   | Built-in Skills (MVP)       | [04-built-in-skills.md](./04-built-in-skills.md)                 | 6.2, 6.3   |
| 5   | Skill Plugin System         | [05-skill-plugin-system.md](./05-skill-plugin-system.md)         | 6.2, 6.3   |
| 6   | Context Menu & Omnibox      | [06-context-menu-omnibox.md](./06-context-menu-omnibox.md)       | 6.1        |
| 7   | Persistent Memory           | [07-persistent-memory.md](./07-persistent-memory.md)             | 6.1, 6.3   |

## Shared Foundation

Before any feature work, scaffold the project with:

```bash
npx wxt@latest init chromeclaw --template react-ts
```

Then install shared dependencies:

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google \
  dexie zustand zod nanoid react-markdown remark-gfm rehype-highlight \
  @mozilla/readability
npm install -D vitest @playwright/test
```

## Critical Shared Files

These files are depended on by multiple features — implement them first:

| File                        | Role                                                              | Features           |
| --------------------------- | ----------------------------------------------------------------- | ------------------ |
| `entrypoints/background.ts` | Service worker: message bus, LLM calls, agent loop                | All                |
| `lib/db/index.ts`           | Dexie database schema (conversations, messages, memories, skills) | 6.1, 6.4, 6.5, 6.7 |
| `lib/tools/registry.ts`     | Tool registry → Vercel AI SDK bridge                              | 6.3, 6.4, 6.5      |
| `lib/ai/client.ts`          | Multi-provider LLM factory                                        | 6.1, 6.7           |
| `lib/ai/prompts.ts`         | System prompt builder (context + memory injection)                | 6.1, 6.2, 6.7      |
| `entrypoints/content.ts`    | Page extraction content script                                    | 6.2, 6.4, 6.6      |
| `types/messages.ts`         | Discriminated union of all extension messages                     | All                |

## Manifest Permissions

Aggregate these in `wxt.config.ts`:

```
sidePanel, activeTab, tabs, tabGroups, contextMenus, storage, scripting,
bookmarks, history, downloads, cookies, notifications, offscreen
host_permissions: <all_urls>
```
