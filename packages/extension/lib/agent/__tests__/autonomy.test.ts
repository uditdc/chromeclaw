import { describe, it, expect } from 'vitest'
import { shouldRequestApproval } from '../autonomy'
import type { ToolDefinition, AutonomyLevel } from '../../../types/agent'

function makeTool(requiresConfirmation: boolean): ToolDefinition {
  return {
    name: 'test_tool',
    description: 'test',
    inputSchema: {} as any,
    requiresConfirmation,
    execute: async () => ({ success: true, data: null }),
  }
}

describe('shouldRequestApproval', () => {
  it('always requires approval for tools with requiresConfirmation', () => {
    const tool = makeTool(true)
    expect(shouldRequestApproval(tool, 'full-auto')).toBe(true)
    expect(shouldRequestApproval(tool, 'confirm-each')).toBe(true)
    expect(shouldRequestApproval(tool, 'manual-only')).toBe(true)
  })

  it('never requires approval in full-auto for non-confirmation tools', () => {
    const tool = makeTool(false)
    expect(shouldRequestApproval(tool, 'full-auto')).toBe(false)
  })

  it('always requires approval in manual-only', () => {
    const tool = makeTool(false)
    expect(shouldRequestApproval(tool, 'manual-only')).toBe(true)
  })

  it('requires approval in confirm-each for non-confirmation tools', () => {
    const tool = makeTool(false)
    expect(shouldRequestApproval(tool, 'confirm-each')).toBe(true)
  })
})
