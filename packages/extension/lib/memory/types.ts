export type MemoryCategory =
  | 'preference'
  | 'fact'
  | 'project'
  | 'instruction'
  | 'technical'

export interface Memory {
  id: string
  content: string
  category: MemoryCategory
  source: {
    conversationId: string
    messageId: string
  }
  confidence: number
  embedding?: number[]
  createdAt: number
  updatedAt: number
  active: boolean
}
