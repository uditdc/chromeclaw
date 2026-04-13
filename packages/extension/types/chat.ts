export type Role = 'user' | 'assistant' | 'system' | 'tool'

export interface Conversation {
  id: string
  title: string
  model: string
  provider: string
  createdAt: number
  updatedAt: number
}

export interface LLMProvider {
  id: string
  name: string
  baseURL: string
  apiKeyRequired: boolean
  models: ModelConfig[]
}

export interface ModelConfig {
  id: string
  name: string
  providerId: string
  supportsVision: boolean
  supportsToolCalling: boolean
  maxTokens: number
}
