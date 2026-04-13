import type { PageContext } from './context'
import type { ToolCall, ToolResult } from './agent'
import type { Memory } from '../lib/memory/types'

// ── Chat ────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  type: 'CHAT_REQUEST'
  conversationId: string
  messages: ChatMessage[]
  model: string
  provider: string
  systemPrompt: string
}

export interface ChatStreamChunk {
  type: 'CHAT_STREAM_CHUNK'
  conversationId: string
  delta: string
  done: boolean
  fullContent?: string
  error?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  model?: string
  provider?: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  createdAt: number
}

// ── Page Context ────────────────────────────────────────────────────────────

export interface ExtractPageRequest {
  type: 'EXTRACT_PAGE'
  options: {
    includeMetadata: boolean
    includeStructured: boolean
    maxTokens: number
  }
}

export interface ExtractPageResponse {
  type: 'EXTRACTION_RESULT'
  context: PageContext
}

export interface ElementPickerActivate {
  type: 'ELEMENT_PICKER_ACTIVATE'
  active: boolean
}

export interface ElementPickerResult {
  type: 'ELEMENT_PICKER_RESULT'
  selector: string
  html: string
  text: string
}

// ── Tool Approval ───────────────────────────────────────────────────────────

export interface ToolApprovalRequest {
  type: 'TOOL_APPROVAL_REQUEST'
  callId: string
  toolName: string
  args: Record<string, unknown>
  description: string
}

export interface ToolApprovalResponse {
  type: 'TOOL_APPROVAL_RESPONSE'
  callId: string
  approved: boolean
}

// ── Entry Points (Context Menu / Omnibox) ───────────────────────────────────

export interface PrefilledPrompt {
  type: 'PREFILLED_PROMPT'
  text: string
  autoSubmit: boolean
  source: 'context-menu' | 'omnibox'
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface VerifyApiKeyRequest {
  type: 'VERIFY_API_KEY'
  providerId: string
  apiKey: string
  baseURL: string
}

// ── Memory ──────────────────────────────────────────────────────────────────

export interface MemoryExtracted {
  type: 'MEMORY_EXTRACTED'
  memories: Memory[]
}

// ── Union ───────────────────────────────────────────────────────────────────

export type ExtensionMessage =
  | ChatRequest
  | ChatStreamChunk
  | ExtractPageRequest
  | ExtractPageResponse
  | ElementPickerActivate
  | ElementPickerResult
  | ToolApprovalRequest
  | ToolApprovalResponse
  | PrefilledPrompt
  | VerifyApiKeyRequest
  | MemoryExtracted
