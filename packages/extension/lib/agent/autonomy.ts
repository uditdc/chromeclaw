import type { AutonomyLevel, ToolDefinition } from '../../types/agent'

export function shouldRequestApproval(
  tool: ToolDefinition,
  level: AutonomyLevel,
): boolean {
  if (tool.requiresConfirmation) return true
  if (level === 'full-auto') return false
  if (level === 'manual-only') return true
  return true
}
