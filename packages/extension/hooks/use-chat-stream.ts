import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import { useSettingsStore } from '../stores/settings-store'
import { connectChatPort, sendChatRequest, onStreamChunk } from '../lib/ai/streaming'
import { buildSystemPrompt } from '../lib/ai/prompts'
import type { ChatRequest } from '../types/messages'

export function useChatStream() {
  const portRef = useRef<Browser.runtime.Port | null>(null)

  const conversation = useChatStore((s) => s.conversation)
  const messages = useChatStore((s) => s.messages)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const error = useChatStore((s) => s.error)

  const { activeProvider, activeModel } = useSettingsStore()

  useEffect(() => {
    const port = connectChatPort()
    portRef.current = port

    const cleanup = onStreamChunk(port, (chunk) => {
      const store = useChatStore.getState()
      if (chunk.error) {
        store.setError(chunk.error)
      } else if (chunk.done) {
        store.finalizeStream(chunk.fullContent)
      } else {
        store.appendStreamDelta(chunk.delta)
      }
    })

    port.onDisconnect.addListener(() => {
      portRef.current = null
    })

    return () => {
      cleanup()
      port.disconnect()
    }
  }, [])

  const ensurePort = useCallback(() => {
    if (portRef.current) return portRef.current
    const port = connectChatPort()
    portRef.current = port
    onStreamChunk(port, (chunk) => {
      const store = useChatStore.getState()
      if (chunk.error) {
        store.setError(chunk.error)
      } else if (chunk.done) {
        store.finalizeStream(chunk.fullContent)
      } else {
        store.appendStreamDelta(chunk.delta)
      }
    })
    port.onDisconnect.addListener(() => {
      portRef.current = null
    })
    return port
  }, [])

  const send = useCallback(
    async (content: string) => {
      if (useChatStore.getState().isStreaming || !content.trim()) return

      const store = useChatStore.getState()
      let conv = store.conversation
      if (!conv) {
        conv = await store.startConversation()
      }

      store.setError(null)
      store.setStreaming(true)

      const currentMessages = useChatStore.getState().messages
      const userMsg = await store.addUserMessage(content)

      const systemPrompt = buildSystemPrompt({})

      const request: ChatRequest = {
        type: 'CHAT_REQUEST',
        conversationId: conv.id,
        messages: [
          ...currentMessages.map((m) => ({
            id: m.id,
            conversationId: m.conversationId,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
          {
            id: userMsg.id,
            conversationId: userMsg.conversationId,
            role: userMsg.role,
            content: userMsg.content,
            createdAt: userMsg.createdAt,
          },
        ],
        model: useSettingsStore.getState().activeModel,
        provider: useSettingsStore.getState().activeProvider,
        systemPrompt,
      }

      const port = ensurePort()
      sendChatRequest(port, request)
    },
    [ensurePort],
  )

  return { send, messages, streamingContent, isStreaming, error }
}
