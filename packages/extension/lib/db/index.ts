import Dexie, { type EntityTable } from 'dexie'
import type { Conversation } from '../../types/chat'
import type { ChatMessage } from '../../types/messages'
import type { Memory } from '../memory/types'

export interface InstalledSkill {
  id: string
  name: string
  description: string
  version: string
  author?: string
  code: string
  permissions: string[]
  enabled: boolean
  installedAt: number
}

export const db = new Dexie('chromeclaw') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>
  messages: EntityTable<ChatMessage, 'id'>
  memories: EntityTable<Memory, 'id'>
  skills: EntityTable<InstalledSkill, 'id'>
}

db.version(1).stores({
  conversations: 'id, createdAt, updatedAt',
  messages: 'id, conversationId, createdAt',
  memories: 'id, category, createdAt, active',
  skills: 'id, name, enabled',
})
