# 0.3 Tool Calling and Agent Loop

## Overview

This is what makes ChromeClaw an agent rather than a chatbot. It implements a ReAct-style loop: the LLM reasons about the user's request, decides which tool(s) to call, ChromeClaw executes the tool, feeds the result back to the LLM, and the loop continues until the LLM produces a final text response or a step limit is reached. The system supports three autonomy levels: full-auto (execute all tools without asking), confirm-each (prompt user before every tool call), and manual-only (show the tool call but require the user to execute it).

## Architecture

**Service Worker**: The agent loop lives entirely in the service worker. It uses Vercel AI SDK's `streamText()` with `tools` and `stopWhen: stepCountIs(maxSteps)`. The SDK handles the loop natively: when the LLM returns a tool call, the SDK executes the tool's `execute` function and feeds the result back. However, for the "confirm-each" autonomy level, we need to intercept before execution, relay to the side panel for user approval, wait for the response, then continue.

**Side Panel**: Displays tool call cards inline in the conversation. For "confirm-each" mode, shows an approval dialog with the tool name, parameters, and approve/reject buttons. Tool results are rendered below the tool call card.

**Tool Registry (`lib/tools/registry.ts`)**: Maintains a map of tool name to tool definition. Each tool follows a standard interface. The registry converts tools into the Vercel AI SDK `tools` format.

## File Structure

```
lib/
  agent/
    loop.ts                      -- Agent loop orchestration, wraps Vercel AI SDK streamText with tools
    autonomy.ts                  -- Autonomy level logic: auto, confirm-each, manual-only
    tool-approval.ts             -- Approval flow: message side panel, await response

  tools/
    registry.ts                  -- Tool registry: register, lookup, convert to AI SDK format
    types.ts                     -- Tool interface, ToolCall, ToolResult types

components/
  agent/
    ToolCallCard.tsx             -- Displays a tool invocation: name, params, status, result
    ApprovalDialog.tsx           -- Confirm/reject dialog for confirm-each mode
    AgentStepIndicator.tsx       -- Shows current step count / max steps

stores/
  agent-store.ts                 -- Zustand: autonomy level, pending approvals, step state

types/
  agent.ts                       -- AutonomyLevel, AgentStep, ToolDefinition types
```

## Key Types

```typescript
// types/agent.ts

type AutonomyLevel = 'full-auto' | 'confirm-each' | 'manual-only';

interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  requiresConfirmation: boolean;  // true for destructive actions regardless of autonomy level
  execute: (params: unknown) => Promise<ToolResult>;
}

interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  status: 'pending-approval' | 'executing' | 'completed' | 'rejected' | 'error';
}

interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
  displayHint?: 'text' | 'json' | 'table' | 'image';
}

interface AgentStep {
  stepNumber: number;
  reasoning?: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

interface ApprovalRequest {
  type: 'TOOL_APPROVAL_REQUEST';
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
  description: string;
}

interface ApprovalResponse {
  type: 'TOOL_APPROVAL_RESPONSE';
  callId: string;
  approved: boolean;
}
```

## Implementation Steps

1. **Define `ToolDefinition` interface** and the tool registry in `lib/tools/registry.ts`. The registry exposes `register(tool)`, `getAll()`, and `toAISDKTools()` which converts to the Vercel AI SDK's `tools` format using `tool()` from the `ai` package.
2. **Implement `loop.ts`**: For `full-auto` mode, call `streamText({ model, tools: registry.toAISDKTools(), stopWhen: stepCountIs(maxSteps), ... })`. The Vercel AI SDK handles the loop internally. Stream chunks and step events back to the side panel over the port.
3. **Implement the approval flow for `confirm-each`**: Instead of passing `execute` directly to the AI SDK, wrap each tool's execute function in an interceptor. The interceptor sends an `ApprovalRequest` to the side panel, creates a Promise, and resolves/rejects it when the `ApprovalResponse` comes back. If rejected, return a `ToolResult` with `success: false` and message "User declined this action".
4. **Handle `manual-only`**: Tools are defined without `execute` functions. The AI SDK will return tool calls without executing them. The side panel displays them as suggestions. If the user clicks "Run", the side panel sends a message to the background to execute the tool manually.
5. **Implement timeout and retry**: Wrap tool execution in a `Promise.race` with a configurable timeout (default 30 seconds). On timeout, return an error result. Optionally retry once on transient failures (network errors).
6. **Build `ToolCallCard.tsx`**: Shows tool name, JSON-formatted parameters, status badge (pending/executing/completed/error), and collapsible result display. Use the `displayHint` from `ToolResult` to choose rendering (raw text, formatted JSON, table, or image).
7. **Build `ApprovalDialog.tsx`**: Modal overlay with tool name, parameter summary, and Approve/Reject buttons. Include a "Always allow this tool" checkbox that upgrades the tool to auto-execute for the session.
8. **Build `AgentStepIndicator.tsx`**: Small badge showing "Step 2/10" during multi-step execution.
9. **Mark destructive tools**: Tools like `tab_manager.closeTab`, `download.start`, `clipboard.write` have `requiresConfirmation: true`. These always show the approval dialog regardless of autonomy level.

## Dependencies

- Vercel AI SDK (tool calling and `stopWhen`)
- Feature 6.1 (streaming infrastructure, port messaging)
- Feature 6.4 (provides the actual tools to register)
- Zod (parameter schemas)

## Testing Strategy

- **Unit tests**: Test the registry's `toAISDKTools()` conversion. Test the approval interceptor with mocked port communication. Test timeout logic.
- **Integration tests**: Mock the AI SDK's `streamText` to return predetermined tool call sequences. Verify that the loop executes tools in order, feeds results back, and terminates correctly. Test all three autonomy levels.
- **E2E tests**: Use a cheap/fast model (or mock). Ask "close my duplicate tabs" and verify the approval dialog appears in confirm-each mode. Verify full-auto mode executes without prompting.
