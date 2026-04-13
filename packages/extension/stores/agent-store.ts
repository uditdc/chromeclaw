import { create } from 'zustand'
import type { AutonomyLevel, ToolCall, ToolResult } from '../types/agent'
import type { ToolApprovalRequest } from '../types/messages'

interface AgentState {
  autonomyLevel: AutonomyLevel
  pendingApproval: ToolApprovalRequest | null
  currentStep: number
  toolCalls: ToolCall[]
  toolResults: Map<string, ToolResult>

  setAutonomyLevel: (level: AutonomyLevel) => void
  setPendingApproval: (req: ToolApprovalRequest | null) => void
  respondToApproval: (
    callId: string,
    approved: boolean,
    port: Browser.runtime.Port | null,
  ) => void
  addToolCall: (tc: ToolCall) => void
  updateToolCall: (callId: string, update: Partial<ToolCall>) => void
  addToolResult: (callId: string, result: ToolResult) => void
  resetTurn: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  autonomyLevel: 'full-auto',
  pendingApproval: null,
  currentStep: 0,
  toolCalls: [],
  toolResults: new Map(),

  setAutonomyLevel: (level) => set({ autonomyLevel: level }),

  setPendingApproval: (req) => set({ pendingApproval: req }),

  respondToApproval: (callId, approved, port) => {
    if (port) {
      port.postMessage({
        type: 'TOOL_APPROVAL_RESPONSE',
        callId,
        approved,
      })
    }
    set({ pendingApproval: null })
  },

  addToolCall: (tc) => {
    set((s) => {
      const existing = s.toolCalls.find((t) => t.id === tc.id)
      if (existing) {
        return {
          toolCalls: s.toolCalls.map((t) =>
            t.id === tc.id ? { ...t, ...tc } : t,
          ),
        }
      }
      return { toolCalls: [...s.toolCalls, tc] }
    })
  },

  updateToolCall: (callId, update) => {
    set((s) => ({
      toolCalls: s.toolCalls.map((t) =>
        t.id === callId ? { ...t, ...update } : t,
      ),
    }))
  },

  addToolResult: (callId, result) => {
    set((s) => {
      const newResults = new Map(s.toolResults)
      newResults.set(callId, result)
      return {
        toolCalls: s.toolCalls.map((t) =>
          t.id === callId ? { ...t, status: 'completed' as const } : t,
        ),
        toolResults: newResults,
      }
    })
  },

  resetTurn: () => set({ toolCalls: [], toolResults: new Map(), currentStep: 0, pendingApproval: null }),
}))
