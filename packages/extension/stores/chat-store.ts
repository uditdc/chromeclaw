import { create } from 'zustand'
import type { Conversation } from '../types/chat'
import type { ChatMessage } from '../types/messages'
import {
  createConversation,
  getMessages,
  addMessage,
  updateConversation,
} from '../lib/db/conversations'
import { useSettingsStore } from './settings-store'

interface ChatState {
  conversation: Conversation | null
  messages: ChatMessage[]
  streamingContent: string
  isStreaming: boolean
  error: string | null

  startConversation: () => Promise<Conversation>
  loadConversation: (id: string) => Promise<void>
  setConversation: (conversation: Conversation) => void
  addUserMessage: (content: string) => Promise<ChatMessage>
  addAssistantMessage: (content: string) => Promise<ChatMessage>
  appendStreamDelta: (delta: string) => void
  finalizeStream: () => Promise<void>
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  switchModel: (provider: string, model: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversation: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  error: null,

  startConversation: async () => {
    const settings = useSettingsStore.getState()
    const conv = await createConversation(settings.activeModel, settings.activeProvider)
    set({ conversation: conv, messages: [], streamingContent: '', error: null })
    return conv
  },

  loadConversation: async (id) => {
    const msgs = await getMessages(id)
    // Conversation object is set separately via setConversation
    set({ messages: msgs, streamingContent: '', error: null })
  },

  setConversation: (conversation) => set({ conversation }),

  addUserMessage: async (content) => {
    const { conversation } = get()
    if (!conversation) throw new Error('No active conversation')
    const msg = await addMessage({
      conversationId: conversation.id,
      role: 'user',
      content,
    })
    set((s) => ({ messages: [...s.messages, msg] }))
    return msg
  },

  addAssistantMessage: async (content) => {
    const { conversation } = get()
    if (!conversation) throw new Error('No active conversation')
    const settings = useSettingsStore.getState()
    const msg = await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content,
      model: settings.activeModel,
      provider: settings.activeProvider,
    })
    set((s) => ({ messages: [...s.messages, msg] }))
    return msg
  },

  appendStreamDelta: (delta) => {
    set((s) => ({ streamingContent: s.streamingContent + delta }))
  },

  finalizeStream: async () => {
    const { streamingContent, conversation } = get()
    if (!streamingContent || !conversation) return
    const settings = useSettingsStore.getState()
    const msg = await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: streamingContent,
      model: settings.activeModel,
      provider: settings.activeProvider,
    })
    set((s) => ({
      messages: [...s.messages, msg],
      streamingContent: '',
      isStreaming: false,
    }))

    // Auto-title on first exchange
    if (get().messages.length === 2) {
      const userMsg = get().messages[0]
      const title = userMsg.content.slice(0, 60) + (userMsg.content.length > 60 ? '…' : '')
      await updateConversation(conversation.id, { title })
      set((s) => ({
        conversation: s.conversation ? { ...s.conversation, title } : null,
      }))
    }
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setError: (error) => set({ error, isStreaming: false }),

  switchModel: (provider, model) => {
    const { conversation } = get()
    if (conversation) {
      updateConversation(conversation.id, { model, provider })
      set({ conversation: { ...conversation, model, provider } })
    }
  },
}))
