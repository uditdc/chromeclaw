# 0.7 Persistent Memory

## Overview

Persistent memory gives ChromeClaw continuity across sessions. During conversations, the system automatically extracts facts about the user (preferences, project names, tools they use, writing style) and stores them in IndexedDB. On each new conversation, relevant memories are injected into the system prompt, making the AI feel personalized. Users can view, edit, and delete memories from the options page.

## Architecture

**Service Worker**: After each assistant response, a lightweight extraction pass runs. This is a secondary LLM call (using a fast/cheap model or the same model with a short prompt) that takes the last few messages and extracts any new facts worth remembering. Extracted facts are stored in Dexie. Before each conversation, the memory store is queried and relevant memories are prepended to the system prompt.

**Options Page**: A memory management UI where users see all stored memories, can edit their text, delete individual memories, or clear all.

**Memory Injection**: The system prompt builder (`lib/ai/prompts.ts`) queries the memory store and injects memories as a "User Profile" section.

## File Structure

```
lib/
  memory/
    extractor.ts                 -- LLM-based fact extraction from conversations
    store.ts                     -- Dexie CRUD for memories
    injector.ts                  -- Query relevant memories and format for system prompt
    types.ts                     -- Memory types

components/
  memory/
    MemoryManager.tsx            -- Options page: list, search, edit, delete memories
    MemoryItem.tsx               -- Single memory with edit/delete controls
    MemoryBadge.tsx              -- Small indicator in side panel showing memory count

lib/
  db/
    memories.ts                  -- Dexie table definition for memories
```

## Key Types

```typescript
// lib/memory/types.ts

type MemoryCategory =
	| 'preference' // "User prefers dark mode", "User likes TypeScript"
	| 'fact' // "User works at Acme Corp", "User's name is Alex"
	| 'project' // "User is working on ChromeClaw extension"
	| 'instruction' // "User wants responses in bullet points"
	| 'technical' // "User's stack: React, Node.js, PostgreSQL"

interface Memory {
	id: string
	content: string // The fact itself, natural language
	category: MemoryCategory
	source: {
		conversationId: string
		messageId: string
	}
	confidence: number // 0-1, how confident the extraction was
	createdAt: number
	updatedAt: number
	active: boolean // user can deactivate without deleting
}

interface MemoryExtractionPrompt {
	recentMessages: Array<{ role: string; content: string }>
	existingMemories: Memory[] // to avoid duplicates
}

interface MemoryInjection {
	memories: Memory[]
	formattedBlock: string // ready to insert into system prompt
}
```

## Implementation Steps

1. **Create the Dexie table** in `lib/db/memories.ts`: table `memories` with indexes on `category`, `createdAt`, `active`.
2. **Implement `extractor.ts`**: After each assistant message, take the last 4-6 messages from the conversation. Build a short extraction prompt: "Extract any new facts about the user from this conversation. Return a JSON array of `{ content, category, confidence }`. Only include facts not already known." Pass `existingMemories` for deduplication. Use `generateObject()` from the AI SDK with a Zod schema for the output. Only store memories with confidence > 0.7.
3. **Implement `store.ts`**: CRUD operations over the Dexie `memories` table. `addMemory(memory)`, `getActiveMemories()`, `updateMemory(id, updates)`, `deleteMemory(id)`, `searchMemories(query)` (text match on `content`).
4. **Implement `injector.ts`**: `getMemoryBlock()` queries all active memories, groups by category, and formats them as a system prompt section:

   ```
   <user_profile>
   ## Preferences
   - Prefers concise responses
   - Uses TypeScript over JavaScript

   ## Projects
   - Currently building ChromeClaw browser extension

   ## Technical Context
   - Stack: React, Node.js, PostgreSQL
   </user_profile>
   ```

5. **Wire into the system prompt builder**: In `lib/ai/prompts.ts`, call `injector.getMemoryBlock()` and append it to the system prompt before each LLM call.
6. **Wire extraction into the agent loop**: In `lib/agent/loop.ts`, after a complete assistant response, fire the extraction as a background task (non-blocking). Use a debounce or rate limit (extract at most once per conversation turn, skip if the conversation is very short).
7. **Build `MemoryManager.tsx`**: Options page component listing all memories grouped by category. Each `MemoryItem` shows the content text, category badge, timestamp, and edit/delete buttons. Include a search bar for filtering. Add a "Clear All" button with confirmation.
8. **Build `MemoryBadge.tsx`**: Small indicator in the side panel header showing the number of active memories (e.g., "12 memories"). Clicking it opens the memory manager in the options page.
9. **Handle memory conflicts**: If extraction produces a memory that contradicts an existing one (e.g., "User prefers Python" vs. existing "User prefers TypeScript"), update the existing memory rather than creating a duplicate. Use a simple string similarity check on content.

## Dependencies

- Feature 6.1 (system prompt builder, conversation access)
- Feature 6.3 (agent loop, post-response hook)
- Vercel AI SDK (`generateObject()` for structured extraction)
- Dexie.js
- Zod (extraction output schema)

## Testing Strategy

- **Unit tests**: Test `extractor.ts` with mocked LLM responses. Feed conversations that contain obvious facts ("I'm working on a React project") and verify extraction. Feed conversations with no personal facts and verify empty extraction. Test deduplication logic.
- **Unit tests**: Test `injector.ts` formatting with various memory sets. Verify the output is well-structured and stays within a token budget. Test `store.ts` CRUD operations.
- **Integration tests**: Run a full extraction cycle: conversation messages in, memories stored in Dexie, then verify `getMemoryBlock()` includes the new facts. Test memory update on contradiction.
- **E2E tests**: Have a conversation mentioning personal facts. Navigate to the options page. Verify the memories appear in the manager. Edit a memory. Start a new conversation and verify the AI references the stored facts. Delete a memory and verify it no longer appears in responses.
