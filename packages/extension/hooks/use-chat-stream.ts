import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import { useSettingsStore } from '../stores/settings-store'
import { connectChatPort, sendChatRequest, onStreamChunk } from '../lib/ai/streaming'
import { buildSystemPrompt } from '../lib/ai/prompts'
import type { ChatRequest } from '../types/messages'

export function useChatStream() {
  const portRef = useRef<Browser.runtime.Port | null>(null)

  const {
    conversation,
    messages,
    streamingContent,
    isStreaming,
    error,
    startConversation,
    addUserMessage,
    appendStreamDelta,
    finalizeStream,
    setStreaming,
    setError,
  } = useChatStore()

  const { activeProvider, activeModel } = useSettingsStore()

  useEffect(() => {
    portRef.current = connectChatPort()
    const cleanup = onStreamChunk(portRef.current, (chunk) => {
      if (chunk.error) {
        setError(chunk.error)
      } else if (chunk.done) {
        finalizeStream()
      } else {
        appendStreamDelta(chunk.delta)
      }
    })

    portRef.current.onDisconnect.addListener(() => {
      portRef.current = null
    })

    return () => {
      cleanup()
      portRef.current?.disconnect()
    }
  }, [appendStreamDelta, finalizeStream])

  const send = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return

      let conv = conversation
      if (!conv) {
        conv = await startConversation()
      }

      setError(null)
      setStreaming(true)

      const userMsg = await addUserMessage(content)

      const systemPrompt = buildSystemPrompt({})

      const request: ChatRequest = {
        type: 'CHAT_REQUEST',
        conversationId: conv.id,
        messages: [
          ...messages.map((m) => ({
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
        model: activeModel,
        provider: activeProvider,
        systemPrompt,
      }

      if (!portRef.current) {
        portRef.current = connectChatPort()
        onStreamChunk(portRef.current, (chunk) => {
          if (chunk.done) {
            finalizeStream()
          } else {
            appendStreamDelta(chunk.delta)
          }
        })
      }

      sendChatRequest(portRef.current, request)
    },
    [
      conversation,
      messages,
      isStreaming,
      activeProvider,
      activeModel,
      startConversation,
      addUserMessage,
      appendStreamDelta,
      finalizeStream,
      setStreaming,
      setError,
    ],
  )

  return { send, messages, streamingContent, isStreaming, error }
}
