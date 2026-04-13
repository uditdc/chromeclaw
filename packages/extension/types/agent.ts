import type { z } from 'zod'

export type AutonomyLevel = 'full-auto' | 'confirm-each' | 'manual-only'

export interface ToolDefinition {
  name: string
  description: string
  parameters: z.ZodSchema
  requiresConfirmation: boolean
  execute: (params: unknown) => Promise<ToolResult>
}

export interface ToolCall {
  id: string
  toolName: string
  args: Record<string, unknown>
  status: 'pending-approval' | 'executing' | 'completed' | 'rejected' | 'error'
}

export interface ToolResult {
  success: boolean
  data: unknown
  error?: string
  displayHint?: 'text' | 'json' | 'table' | 'image'
}

export interface AgentStep {
  stepNumber: number
  reasoning?: string
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
}
