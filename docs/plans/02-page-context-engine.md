# 0.2 Page Context Engine

## Overview

The page context engine is ChromeClaw's core differentiator over cloud-based AI assistants. Content scripts injected into every page extract readable text, metadata, structured data (tables, lists, code blocks), and enable element-level targeting where the user clicks a DOM node to add it to the AI's context. The engine also supports multi-tab context (pulling from several tabs at once) and screenshot capture.

## Architecture

**Content Script (`entrypoints/content.ts`)**: Injected into all pages (`matches: ['<all_urls>']`). On demand (triggered by message from background), it extracts page content using a Readability-like parser, collects metadata (title, description, Open Graph tags), and identifies structured elements. It does NOT run automatically on every page load to save resources; extraction is triggered by the service worker when the user asks a question or when the side panel opens.

**Element Targeting Content Script (`entrypoints/element-picker.content.ts`)**: A separate content script activated only when the user enters "element pick" mode. Adds hover highlighting and click-to-select behavior. Sends the selected DOM subtree's serialized HTML back to the background.

**Service Worker**: Coordinates multi-tab extraction by messaging content scripts in multiple tabs via `chrome.tabs.sendMessage()`. Manages the page cache (in-memory Map, keyed by tabId). Handles `chrome.tabs.captureVisibleTab` for screenshots.

**Side Panel**: Displays current page context status, shows which elements are in context, allows toggling element picker mode.

## File Structure

```
entrypoints/
  content.ts                     -- Page extraction content script (all URLs)
  element-picker.content.ts      -- Element targeting overlay (activated on demand)

lib/
  context/
    extractor.ts                 -- Core extraction: readable text, metadata, structured data
    chunker.ts                   -- Smart truncation: split content into token-bounded chunks
    serializer.ts                -- Serialize DOM nodes to structured representation
    screenshot.ts                -- Wrapper around chrome.tabs.captureVisibleTab
    multi-tab.ts                 -- Coordinate extraction across multiple tabs

components/
  context/
    ContextPanel.tsx             -- Shows what page context is active, token count estimate
    ElementPickerToggle.tsx      -- Button to activate/deactivate element selection mode
    TabContextSelector.tsx       -- UI to select which tabs contribute context

types/
  context.ts                     -- PageContext, ExtractedElement, Chunk types

stores/
  context-store.ts               -- Zustand: active page context, selected elements, tab list
```

## Key Types

```typescript
// types/context.ts

interface PageContext {
  tabId: number;
  url: string;
  title: string;
  metadata: PageMetadata;
  content: ContentChunk[];
  selectedElements: ExtractedElement[];
  screenshot?: string;  // base64 data URL
  extractedAt: number;
}

interface PageMetadata {
  title: string;
  description: string;
  ogImage?: string;
  author?: string;
  publishedDate?: string;
  language: string;
  siteName?: string;
}

interface ContentChunk {
  id: string;
  text: string;
  type: 'paragraph' | 'heading' | 'code' | 'table' | 'list' | 'blockquote';
  tokenEstimate: number;
  sourceSelector?: string;  // CSS selector path for traceability
}

interface ExtractedElement {
  id: string;
  selector: string;
  html: string;
  text: string;
  type: string;  // tag name
  tokenEstimate: number;
}

interface ExtractionRequest {
  type: 'EXTRACT_PAGE';
  options: {
    includeMetadata: boolean;
    includeStructured: boolean;
    maxTokens: number;
  };
}

interface ExtractionResponse {
  type: 'EXTRACTION_RESULT';
  context: PageContext;
}
```

## Implementation Steps

1. **Build `extractor.ts`**: Use Mozilla's Readability algorithm (via `@mozilla/readability` or a lightweight port) to extract main content. Parse `<meta>` tags for metadata. Walk the DOM to identify tables, code blocks, and lists as structured elements.
2. **Build `chunker.ts`**: Implement token estimation (rough: `text.length / 4`). Split extracted content into chunks that fit within a configurable token budget. Prioritize: metadata first, then headings, then body paragraphs, then structured data. Drop low-signal chunks (nav, footer, ads) first.
3. **Implement `content.ts`**: Register a message listener for `EXTRACT_PAGE`. Run the extractor, apply chunking, respond with the result. Keep it lazy (no work on page load).
4. **Implement `element-picker.content.ts`**: On activation, inject a full-page transparent overlay. On `mousemove`, highlight the hovered element with a colored border. On `click`, serialize the element's `outerHTML` and inner text, send it back via `chrome.runtime.sendMessage`, then deactivate.
5. **Build `screenshot.ts`**: Thin wrapper calling `chrome.tabs.captureVisibleTab(tabId, { format: 'png' })`. Returns the base64 data URL.
6. **Build `multi-tab.ts`**: Accept a list of tab IDs. For each, send `EXTRACT_PAGE` via `chrome.tabs.sendMessage`. Aggregate results. Apply a global token budget across all tabs (proportional allocation).
7. **Wire into background service worker**: Before each LLM call, optionally extract context from the active tab. Attach context to the system prompt via `lib/ai/prompts.ts`. Cache in an in-memory `Map<number, PageContext>` keyed by tabId, with a TTL of 60 seconds.
8. **Build UI components**: `ContextPanel` in the side panel shows a summary of what context is active (page title, token count, number of selected elements). `ElementPickerToggle` sends a message to activate/deactivate the picker. `TabContextSelector` lists open tabs with checkboxes.

## Dependencies

- `@mozilla/readability` (or a custom lightweight implementation)
- Feature 6.1 (side panel and background messaging infrastructure)

## Testing Strategy

- **Unit tests**: Feed `extractor.ts` known HTML strings (a Wikipedia article, a GitHub README, a code documentation page). Assert that structured elements are correctly categorized. Test `chunker.ts` with content exceeding token limits; verify chunks respect boundaries and priority ordering.
- **Integration tests**: Mock `chrome.tabs.sendMessage` and `chrome.tabs.captureVisibleTab`. Verify multi-tab extraction aggregates correctly. Verify screenshot returns a valid data URL.
- **E2E tests (Playwright)**: Navigate to a test page with known content. Trigger extraction via the side panel. Verify the context panel shows correct metadata. Test element picker: click an element, verify it appears in selected elements list.
