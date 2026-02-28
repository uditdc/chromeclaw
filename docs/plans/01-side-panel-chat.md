# 0.1 Intelligent Side Panel Chat

## Overview

The side panel chat is ChromeClaw's primary user interface. It lives in a Chrome side panel that persists across navigation, providing an always-available AI assistant. It handles streaming LLM responses token-by-token, maintains conversation history in IndexedDB, supports switching between LLM providers/models mid-conversation, and renders rich output (markdown, code blocks, tables). The keyboard shortcut Ctrl+Shift+L (Cmd+Shift+L on macOS) toggles the panel. Conversations can be exported as Markdown or JSON.

This is the foundation that every other feature plugs into.

## Architecture

**Service Worker (`entrypoints/background.ts`)**: Owns all LLM API calls. The side panel sends a message like `{ type: 'CHAT_REQUEST', conversationId, messages }`. The service worker calls Vercel AI SDK's `streamText()`, then relays streamed chunks back to the side panel via `chrome.runtime.Port` (long-lived connection). This avoids CORS issues and keeps API keys out of the UI context.

**Side Panel (`entrypoints/sidepanel/`)**: A React 19 app. Uses Zustand for UI state (current conversation, input value, streaming state). Subscribes to the background port for streamed tokens. Renders markdown via a markdown renderer component. Dexie.js handles read/write of conversation history.

**Options Page (`entrypoints/options/`)**: Provides the API key configuration and model selection UI. Stores values in `chrome.storage.sync`.

## File Structure

```
entrypoints/
  background.ts                  -- Service worker: message routing, LLM calls
  sidepanel/
    index.html                   -- WXT HTML entrypoint
    main.tsx                     -- React root mount
    App.tsx                      -- Layout shell, router between chat/history views

components/
  chat/
    ChatView.tsx                 -- Main chat container: message list + input
    MessageBubble.tsx            -- Single message: role-based styling, markdown rendering
    StreamingIndicator.tsx       -- Typing/streaming animation
    ChatInput.tsx                -- Textarea with submit, model selector dropdown
    ModelSwitcher.tsx            -- Dropdown for switching provider/model
    ConversationList.tsx         -- Sidebar list of past conversations with search
    ExportDialog.tsx             -- Modal for Markdown/JSON export
  markdown/
    MarkdownRenderer.tsx         -- Renders markdown content (code blocks, tables, images)
    CodeBlock.tsx                -- Syntax-highlighted code block with copy button

lib/
  ai/
    client.ts                    -- Vercel AI SDK provider setup (Anthropic, OpenAI, Google, Ollama, OpenRouter)
    streaming.ts                 -- Port-based streaming relay between service worker and side panel
    prompts.ts                   -- System prompt builder (assembles base prompt + memory + context)

stores/
  chat-store.ts                  -- Zustand: active conversation, messages, streaming state, input
  settings-store.ts              -- Zustand: wraps chrome.storage.sync for API keys, model prefs

hooks/
  use-chat-stream.ts             -- Hook: opens port to background, handles streaming lifecycle
  use-conversations.ts           -- Hook: Dexie queries for conversation list, search, filtering

types/
  chat.ts                        -- Message, Conversation, Provider, Model types

lib/
  db/
    index.ts                     -- Dexie database singleton, schema definition
    conversations.ts             -- Dexie table helpers for conversations and messages
```

## Key Types

```typescript
// types/chat.ts

type Role = 'user' | 'assistant' | 'system' | 'tool';

interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  model?: string;
  provider?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  createdAt: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
}

interface LLMProvider {
  id: string;  // 'anthropic' | 'openai' | 'google' | 'ollama' | 'openrouter'
  name: string;
  models: ModelConfig[];
  apiKeyRequired: boolean;
}

interface ModelConfig {
  id: string;  // e.g. 'claude-sonnet-4-5-20250929'
  name: string;
  providerId: string;
  supportsVision: boolean;
  supportsToolCalling: boolean;
  maxTokens: number;
}

interface ChatRequest {
  type: 'CHAT_REQUEST';
  conversationId: string;
  messages: Message[];
  model: string;
  provider: string;
  systemPrompt: string;
}

interface ChatStreamChunk {
  type: 'CHAT_STREAM_CHUNK';
  conversationId: string;
  delta: string;
  done: boolean;
}
```

## Implementation Steps

1. **Scaffold WXT project** with React 19, Tailwind, TypeScript. Configure `wxt.config.ts` with `srcDir`, manifest `action: {}`, and sidepanel behavior.
2. **Create the Dexie database** in `lib/db/index.ts`. Define `conversations` and `messages` tables with indexed fields (`conversationId`, `createdAt`).
3. **Build `settings-store.ts`** wrapping `chrome.storage.sync` for API keys and model preferences. Provide `getApiKey(provider)` and `getActiveModel()`.
4. **Implement `lib/ai/client.ts`**: Factory function that returns a Vercel AI SDK provider instance based on the selected provider. Handle Ollama via `createOpenAI({ baseURL: 'http://localhost:11434/v1' })`.
5. **Implement background service worker**: Listen on `chrome.runtime.onConnect` for a port named `'chat'`. On receiving `ChatRequest`, call `streamText()` with the configured provider, pipe `textStream` chunks back over the port as `ChatStreamChunk` messages.
6. **Build `use-chat-stream.ts` hook**: Opens a port to background, sends `ChatRequest`, accumulates streamed deltas into a reactive message. Exposes `{ send, messages, isStreaming, error }`.
7. **Build the UI components**: `ChatView` orchestrates the message list and input. `MessageBubble` uses `MarkdownRenderer` for assistant messages. `ChatInput` handles Enter-to-send, Shift+Enter for newline.
8. **Add conversation persistence**: After a stream completes, write the full assistant message to Dexie. Load conversation list on mount via `use-conversations.ts`.
9. **Implement search/filtering** in `ConversationList`: Dexie `.where()` on title, full-text search over message content using `.filter()`.
10. **Add `ModelSwitcher`**: Reads available models from `settings-store`, dispatches model change that persists to the conversation record.
11. **Implement export**: `ExportDialog` serializes the current conversation to Markdown (formatted) or JSON, triggers a download via `URL.createObjectURL`.
12. **Register keyboard shortcut** in `wxt.config.ts` manifest commands: `{ "_execute_action": { "suggested_key": { "default": "Ctrl+Shift+L", "mac": "Command+Shift+L" } } }`. Background script handles `chrome.action.onClicked` to toggle `chrome.sidePanel.open()`.

## Dependencies

- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`)
- Dexie.js
- Zustand
- A markdown rendering library (e.g., `react-markdown` + `remark-gfm` + `rehype-highlight`)
- `nanoid` for ID generation

## Testing Strategy

- **Unit tests (Vitest)**: Test `MarkdownRenderer` with various markdown inputs (tables, code fences, nested lists). Test `settings-store` read/write logic with mocked `chrome.storage`. Test export serialization (Markdown and JSON output format).
- **Integration tests (Vitest)**: Mock the `chrome.runtime.Port` to simulate streaming. Verify that `use-chat-stream` accumulates chunks correctly and signals completion.
- **E2E tests (Playwright)**: Load the extension, open the side panel, type a message, verify a response streams in. Test conversation persistence (close/reopen panel, verify history). Test model switching mid-conversation.
