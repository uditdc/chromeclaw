import { nanoid } from 'nanoid'
import { db } from './index'
import type { Conversation } from '../../types/chat'
import type { ChatMessage } from '../../types/messages'

export async function createConversation(
  model: string,
  provider: string,
): Promise<Conversation> {
  const now = Date.now()
  const conversation: Conversation = {
    id: nanoid(),
    title: 'New conversation',
    model,
    provider,
    createdAt: now,
    updatedAt: now,
  }
  await db.conversations.add(conversation)
  return conversation
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'model' | 'provider'>>,
) {
  await db.conversations.update(id, { ...updates, updatedAt: Date.now() })
}

export async function deleteConversation(id: string) {
  await db.transaction('rw', db.conversations, db.messages, async () => {
    await db.messages.where('conversationId').equals(id).delete()
    await db.conversations.delete(id)
  })
}

export async function listConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy('updatedAt').reverse().toArray()
}

export async function searchConversations(query: string): Promise<Conversation[]> {
  const lower = query.toLowerCase()
  const allConversations = await db.conversations.orderBy('updatedAt').reverse().toArray()
  if (!query.trim()) return allConversations

  const matchingConvIds = new Set<string>()

  for (const c of allConversations) {
    if (c.title.toLowerCase().includes(lower)) {
      matchingConvIds.add(c.id)
    }
  }

  const messages = await db.messages.toArray()
  for (const m of messages) {
    if (m.content.toLowerCase().includes(lower)) {
      matchingConvIds.add(m.conversationId)
    }
  }

  return allConversations.filter((c) => matchingConvIds.has(c.id))
}

export async function addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
  const full: ChatMessage = {
    ...message,
    id: nanoid(),
    createdAt: Date.now(),
  }
  await db.messages.add(full)
  await db.conversations.update(message.conversationId, { updatedAt: Date.now() })
  return full
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return db.messages.where('conversationId').equals(conversationId).sortBy('createdAt')
}
