import type { ToolDefinition } from '../../types/agent'

const tools = new Map<string, ToolDefinition>()

export function register(definition: ToolDefinition) {
  tools.set(definition.name, definition)
}

export function get(name: string): ToolDefinition | undefined {
  return tools.get(name)
}

export function getAll(): ToolDefinition[] {
  return Array.from(tools.values())
}

/**
 * Converts registered tools into the shape expected by the AI SDK's
 * `streamText({ tools })`. Each entry uses the tool's Zod schema as
 * `parameters` and wires up `execute`.
 *
 * The return type is intentionally `Record<string, unknown>` because
 * the AI SDK's Tool generic makes it impossible to build a heterogeneous
 * map without erasing the per-tool parameter type. `streamText` accepts
 * this at runtime — the schemas carry the validation.
 */
export function toAISDKTools(): Record<string, unknown> {
  const sdkTools: Record<string, unknown> = {}
  for (const def of tools.values()) {
    sdkTools[def.name] = {
      description: def.description,
      parameters: def.parameters,
      execute: async (params: unknown) => def.execute(params),
    }
  }
  return sdkTools
}
