# 0.6 Context Menu and Omnibox

## Overview

Context menu and omnibox provide low-friction entry points to ChromeClaw. The context menu appears on right-click with options like "Ask ChromeClaw", "Summarize", "Translate", and "Explain Code" for selected text. The omnibox lets users type `cc ` in the address bar to send quick commands without opening the side panel. Both funnel into the existing chat infrastructure.

## Architecture

**Service Worker**: Registers context menu items via `chrome.contextMenus.create()` at startup. Handles `chrome.contextMenus.onClicked` to open the side panel and inject the selected text as a pre-filled prompt. Registers the omnibox keyword `cc` and handles `chrome.omnibox.onInputEntered` to process commands.

**Side Panel**: Receives pre-filled prompts from the background (via message) and auto-submits them. The user sees the side panel open with the query already in flight.

## File Structure

```
lib/
  entry-points/
    context-menu.ts              -- Register menu items, handle clicks
    omnibox.ts                   -- Register omnibox, handle input, suggest completions

types/
  entry-points.ts                -- ContextMenuAction, OmniboxCommand types
```

## Key Types

```typescript
// types/entry-points.ts

type ContextMenuAction = 'ask' | 'summarize' | 'translate' | 'explain-code';

interface ContextMenuEvent {
  action: ContextMenuAction;
  selectionText: string;
  pageUrl: string;
  pageTitle: string;
}

interface OmniboxCommand {
  rawInput: string;
  parsed: {
    action?: string;             // first word if recognized (summarize, translate, etc.)
    query: string;               // remaining text
  };
}

interface PrefilledPrompt {
  type: 'PREFILLED_PROMPT';
  text: string;
  autoSubmit: boolean;
  source: 'context-menu' | 'omnibox';
}
```

## Implementation Steps

1. **Implement `context-menu.ts`**: At service worker startup, call `chrome.contextMenus.create()` for each action: "Ask ChromeClaw about '%s'", "Summarize", "Translate", "Explain Code". Use `contexts: ['selection']` so they only appear when text is selected. For "Ask ChromeClaw", also add a `contexts: ['page']` variant that works without selection.
2. **Handle `chrome.contextMenus.onClicked`**: Map the `menuItemId` to a `ContextMenuAction`. Build a prompt string (e.g., for "Summarize": `"Summarize the following text:\n\n${selectionText}"`). Open the side panel via `chrome.sidePanel.open({ tabId })`. Send a `PrefilledPrompt` message to the side panel.
3. **Implement `omnibox.ts`**: Register the omnibox keyword in `wxt.config.ts` manifest: `"omnibox": { "keyword": "cc" }`. Handle `chrome.omnibox.onInputChanged` to provide suggestions (e.g., "cc summarize" -> suggest "Summarize current page"). Handle `chrome.omnibox.onInputEntered` to open the side panel and send the command as a `PrefilledPrompt`.
4. **Side panel handling**: In `ChatView.tsx`, listen for `PrefilledPrompt` messages. When received, set the input text and (if `autoSubmit`) immediately trigger the chat request.
5. **Add prompt templates**: Map each `ContextMenuAction` to a well-crafted prompt template. "Summarize" should include instructions for format and length. "Translate" should detect source language and translate to the user's preferred language (from settings). "Explain Code" should provide line-by-line explanation.

## Dependencies

- Feature 6.1 (side panel chat, message routing)
- Chrome APIs: `contextMenus`, `omnibox`, `sidePanel`

## Testing Strategy

- **Unit tests**: Test prompt template generation for each context menu action. Test omnibox input parsing (extracting action and query).
- **Integration tests**: Mock `chrome.contextMenus` and `chrome.omnibox`. Verify that menu items are created at startup. Simulate a click event and verify the correct `PrefilledPrompt` is dispatched.
- **E2E tests**: Right-click selected text on a test page. Verify the context menu shows ChromeClaw options. Click "Summarize". Verify the side panel opens with the summarize prompt. Test omnibox: type `cc summarize this page` in the address bar, verify the side panel opens and processes the command.
