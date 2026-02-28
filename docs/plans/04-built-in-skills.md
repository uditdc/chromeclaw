# 0.4 Built-in Skills (MVP)

## Overview

Ten built-in skills provide ChromeClaw's out-of-the-box capabilities. Each skill wraps specific Chrome APIs behind the `ToolDefinition` interface so the agent loop can invoke them. Skills range from reading page content to managing tabs, bookmarks, history, downloads, clipboard, notifications, and web search.

## Architecture

Each skill is a standalone module in `skills/builtin/`. It exports a `ToolDefinition` object. The background service worker imports all built-in skills and registers them with the tool registry at startup. Skills that need content script cooperation (like `page_reader`, `storage_inspector`) communicate via `chrome.tabs.sendMessage`.

Skills receive no raw `chrome.*` references in their parameters; they use them internally. This is fine for built-in skills (they are trusted, first-party code). The `BrowserContext` abstraction from Feature 6.5 applies to third-party skills only.

## File Structure

```
skills/
  builtin/
    page-reader.ts               -- Extract and summarize current page
    tab-manager.ts               -- Open, close, search, group, reorder tabs
    web-search.ts                -- Web search via fetch() from service worker
    screenshot.ts                -- Capture visible tab as image
    clipboard.ts                 -- Read/write clipboard
    bookmark-manager.ts          -- Search, create, organize bookmarks
    history-search.ts            -- Search browsing history with filters
    download.ts                  -- Trigger and manage file downloads
    storage-inspector.ts         -- Read cookies and localStorage
    notification.ts              -- Send desktop notifications
    index.ts                     -- Barrel export, registers all skills with registry
```

## Parameter Schemas

```typescript
// page-reader
const pageReaderParams = z.object({
  tabId: z.number().optional(),         // defaults to active tab
  maxTokens: z.number().default(4000),
  includeMetadata: z.boolean().default(true),
});

// tab-manager
const tabManagerParams = z.object({
  action: z.enum(['list', 'open', 'close', 'search', 'group', 'activate']),
  url: z.string().optional(),
  tabId: z.number().optional(),
  query: z.string().optional(),
  groupName: z.string().optional(),
  tabIds: z.array(z.number()).optional(),
});

// web-search
const webSearchParams = z.object({
  query: z.string(),
  numResults: z.number().default(5),
});

// screenshot
const screenshotParams = z.object({
  format: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().min(0).max(100).optional(),
});

// clipboard
const clipboardParams = z.object({
  action: z.enum(['read', 'write']),
  text: z.string().optional(),         // required for write
});

// bookmark-manager
const bookmarkParams = z.object({
  action: z.enum(['search', 'create', 'delete', 'list']),
  query: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  folderId: z.string().optional(),
});

// history-search
const historySearchParams = z.object({
  query: z.string(),
  maxResults: z.number().default(20),
  startTime: z.number().optional(),    // epoch ms
  endTime: z.number().optional(),
});

// download
const downloadParams = z.object({
  action: z.enum(['start', 'list', 'cancel', 'pause', 'resume']),
  url: z.string().optional(),
  filename: z.string().optional(),
  downloadId: z.number().optional(),
});

// storage-inspector
const storageInspectorParams = z.object({
  target: z.enum(['cookies', 'localStorage', 'sessionStorage']),
  domain: z.string().optional(),       // defaults to active tab's domain
  key: z.string().optional(),
});

// notification
const notificationParams = z.object({
  title: z.string(),
  message: z.string(),
  iconUrl: z.string().optional(),
});
```

## Implementation Steps

1. **`page-reader.ts`**: Delegates to the page context engine (Feature 6.2). Sends `EXTRACT_PAGE` to the content script, returns the chunked content. Mark `requiresConfirmation: false`.
2. **`tab-manager.ts`**: Uses `chrome.tabs` and `chrome.tabGroups` APIs. `list` returns all tabs with title/URL/id. `open` creates a new tab. `close` removes tabs (mark `requiresConfirmation: true` for close). `search` filters tabs by title/URL. `group` creates/adds to tab groups. `activate` switches to a tab.
3. **`web-search.ts`**: Uses `fetch()` from the service worker to call a search API. Options: DuckDuckGo Instant Answer API (free, no key), or Google Custom Search (requires API key). Parse results into a structured list of `{ title, url, snippet }`. Mark `requiresConfirmation: false`.
4. **`screenshot.ts`**: Calls `chrome.tabs.captureVisibleTab`. Returns the base64 data URL. For vision-capable models, this gets included as an image in the next message.
5. **`clipboard.ts`**: `read` uses an offscreen document (MV3 requirement; `chrome.offscreen` API) since service workers lack DOM access. `write` similarly. Mark write as `requiresConfirmation: true`.
6. **`bookmark-manager.ts`**: Uses `chrome.bookmarks` API. `search` uses `chrome.bookmarks.search()`. `create` uses `chrome.bookmarks.create()`. Mark create/delete as `requiresConfirmation: true`.
7. **`history-search.ts`**: Uses `chrome.history.search()` with text query and time range filters. Returns `{ title, url, visitCount, lastVisitTime }[]`.
8. **`download.ts`**: Uses `chrome.downloads` API. `start` triggers a download from URL. `list` shows recent downloads. Mark start as `requiresConfirmation: true`.
9. **`storage-inspector.ts`**: For cookies, uses `chrome.cookies.getAll({ domain })`. For localStorage/sessionStorage, sends a message to the content script which reads `window.localStorage` / `window.sessionStorage` and returns key-value pairs. Mark as `requiresConfirmation: false` (read-only).
10. **`notification.ts`**: Uses `chrome.notifications.create()`. Mark `requiresConfirmation: false`.
11. **Create `skills/builtin/index.ts`**: Import all skills, call `registry.register()` for each. This file is imported by the background service worker at startup.

## Dependencies

- Feature 6.2 (page context engine, used by `page_reader` and `storage_inspector`)
- Feature 6.3 (tool registry and `ToolDefinition` interface)
- Chrome APIs: `tabs`, `tabGroups`, `bookmarks`, `history`, `downloads`, `cookies`, `notifications`, `offscreen`
- These Chrome permissions must be declared in `wxt.config.ts` manifest

## Testing Strategy

- **Unit tests**: For each skill, mock the relevant `chrome.*` API. Call `execute()` with known parameters. Assert the returned `ToolResult` has the expected structure and data. Test error cases (invalid tabId, network failure in web search).
- **Integration tests**: Register all skills with the registry. Verify `toAISDKTools()` produces valid tool definitions with correct parameter schemas. Test that parameter validation (Zod) correctly rejects invalid inputs.
- **E2E tests**: Load a test page. Ask the agent "what tabs do I have open?" and verify it calls `tab_manager` with `action: 'list'`. Ask "take a screenshot" and verify an image appears in the chat. Test clipboard read/write cycle.
