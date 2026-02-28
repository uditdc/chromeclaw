# 0.5 Skill Plugin System

## Overview

The plugin system allows third-party skills to extend ChromeClaw without modifying core code. Skills are self-contained modules that declare a name, description, JSON Schema for parameters, required permissions, and an async execute function. Third-party skills do NOT get raw `chrome.*` access; they interact through a controlled `BrowserContext` interface. Execution happens in a sandboxed iframe to prevent malicious code from accessing extension internals.

## Architecture

**Sandboxed Execution**: Community/user skills run in a sandboxed iframe (`sandbox` page declared in the manifest). The main extension posts a message to the iframe with the skill code and parameters. The iframe executes the skill and posts the result back. The iframe has no access to `chrome.*` APIs or the extension's origin.

**BrowserContext**: A proxy object provided to sandboxed skills. It exposes safe, read-only methods like `getActiveTab()`, `getPageContent()`, `readStorage()`. Write operations like `openTab()` or `writeClipboard()` go through a message channel back to the service worker, which checks the skill's declared permissions before executing.

**Skill Manifest**: Each skill declares its permissions (e.g., `['tabs:read', 'tabs:write', 'page:read', 'storage:read']`). At install time, the user approves these permissions. The service worker enforces permissions at runtime.

## File Structure

```
entrypoints/
  sandbox.html                   -- Sandboxed iframe for skill execution (no chrome.* access)
  sandbox.ts                     -- Script inside the sandbox: receives skill code, runs it, returns result

lib/
  plugins/
    loader.ts                    -- Load and validate skill manifests
    sandbox-bridge.ts            -- Communication bridge between service worker and sandbox iframe
    browser-context.ts           -- BrowserContext implementation (proxied API surface for skills)
    permissions.ts               -- Permission checking and enforcement
    skill-validator.ts           -- Validate skill structure with Zod before registration

skills/
  types.ts                       -- Skill interface, SkillPermission, BrowserContext types

components/
  skills/
    SkillManager.tsx             -- Options page: list installed skills, enable/disable, view permissions
    SkillInstallDialog.tsx       -- Permission approval dialog during skill install
    SkillCard.tsx                -- Card showing skill name, description, permissions, status

stores/
  skills-store.ts                -- Zustand: installed skills, enabled/disabled state

lib/
  db/
    skills.ts                    -- Dexie table for installed skill metadata and code
```

## Key Types

```typescript
// skills/types.ts

type SkillPermission =
	| 'tabs:read'
	| 'tabs:write'
	| 'page:read'
	| 'page:write'
	| 'storage:read'
	| 'storage:write'
	| 'bookmarks:read'
	| 'bookmarks:write'
	| 'history:read'
	| 'downloads:read'
	| 'downloads:write'
	| 'clipboard:read'
	| 'clipboard:write'
	| 'notifications:write'
	| 'network:fetch'

interface Skill {
	name: string
	description: string
	version: string
	author?: string
	parameters: z.ZodSchema
	permissions: SkillPermission[]
	execute: (params: unknown, context: BrowserContext) => Promise<SkillResult>
}

interface SkillManifest {
	name: string
	description: string
	version: string
	author: string
	permissions: SkillPermission[]
	parametersSchema: Record<string, unknown> // JSON Schema
	entrypoint: string // relative path to the execute function module
}

interface SkillResult {
	success: boolean
	data: unknown
	error?: string
	displayHint?: 'text' | 'json' | 'table' | 'image'
}

interface BrowserContext {
	getActiveTab(): Promise<{ id: number; url: string; title: string }>
	getPageContent(tabId?: number): Promise<string>
	getTabs(query?: { url?: string; title?: string }): Promise<TabInfo[]>
	openTab(url: string): Promise<TabInfo>
	readStorage(key: string): Promise<unknown>
	writeStorage(key: string, value: unknown): Promise<void>
	fetch(url: string, options?: RequestInit): Promise<{ status: number; body: string }>
	notify(title: string, message: string): Promise<void>
}

interface InstalledSkill {
	id: string
	manifest: SkillManifest
	code: string // bundled JS to run in sandbox
	enabled: boolean
	grantedPermissions: SkillPermission[]
	installedAt: number
}
```

## Implementation Steps

1. **Define the `BrowserContext` interface** in `skills/types.ts`. This is the contract third-party skills code against.
2. **Implement `browser-context.ts`**: A factory that creates a `BrowserContext` for a given skill. Each method checks the skill's `grantedPermissions` before executing. Unauthorized calls throw a `PermissionDeniedError`. Authorized calls delegate to the service worker's Chrome APIs.
3. **Create `sandbox.html` and `sandbox.ts`**: The HTML page is declared as a sandbox page in the manifest (`"sandbox": { "pages": ["sandbox.html"] }`). The script listens for `message` events containing `{ skillCode, params, contextProxy }`. It evaluates the skill code in a restricted scope, calls its `execute` function with a proxied `BrowserContext`, and posts the result back.
4. **Implement `sandbox-bridge.ts`**: Manages communication between the service worker and the sandboxed iframe. Creates the iframe (hidden, off-screen), sends skill execution requests, listens for results. Uses `structuredClone`-safe messages. Implements timeout (30s default).
5. **Implement `permissions.ts`**: `checkPermission(skill, permission)` returns boolean. `enforcePermission(skill, permission)` throws if denied. Provides a `getRequiredPermissions(skill)` helper.
6. **Implement `skill-validator.ts`**: Uses Zod to validate that a skill manifest has all required fields, that the parameter schema is valid JSON Schema, and that permissions are from the allowed set.
7. **Implement `loader.ts`**: Loads a skill from a source (initially: local file import or pasted JSON). Validates with `skill-validator`, shows the install dialog with permission list, stores in Dexie.
8. **Build UI components**: `SkillManager` on the options page lists all installed skills with toggle switches. `SkillInstallDialog` shows the requested permissions with checkboxes (all-or-nothing for MVP). `SkillCard` shows name, description, author, permission badges.
9. **Register plugin skills with the tool registry**: On startup, load enabled skills from Dexie, wrap each in a `ToolDefinition` whose `execute` function delegates to the sandbox bridge.

## Dependencies

- Feature 6.3 (tool registry)
- Feature 6.2 (page context, used by `BrowserContext.getPageContent`)
- Dexie.js (skill storage)
- Zod (manifest and parameter validation)

## Testing Strategy

- **Unit tests**: Test `permissions.ts` enforcement (authorized vs. unauthorized calls). Test `skill-validator.ts` with valid and invalid manifests. Test `BrowserContext` methods with mocked Chrome APIs.
- **Integration tests**: Load a test skill into the sandbox, execute it, verify the result. Test that the sandbox cannot access `chrome.*` (attempt should fail silently). Test permission enforcement end-to-end: skill requests `tabs:write`, but was only granted `tabs:read`.
- **Security tests**: Attempt to break out of the sandbox (access `parent.document`, `window.chrome`, etc.). Verify all attempts fail. Test that skill code cannot `fetch()` to the extension's origin.
- **E2E tests**: Install a test skill via the options page UI. Verify it appears in the skill list. Use it via the chat ("use my custom skill"). Verify the result renders correctly.
