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
