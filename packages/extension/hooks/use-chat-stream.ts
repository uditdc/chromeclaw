import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import { useSettingsStore } from '../stores/settings-store'
import { useAgentStore } from '../stores/agent-store'
import { connectChatPort, sendChatRequest } from '../lib/ai/streaming'
import { buildSystemPrompt } from '../lib/ai/prompts'
import type { ChatRequest, ChatStreamChunk, ToolApprovalRequest } from '../types/messages'

type PortMessage = ChatStreamChunk | ToolApprovalRequest

function handlePortMessage(msg: PortMessage) {
  if (msg.type === 'TOOL_APPROVAL_REQUEST') {
    useAgentStore.getState().setPendingApproval(msg)
    return
  }

  if (msg.type !== 'CHAT_STREAM_CHUNK') return

  const chatStore = useChatStore.getState()
  const agentStore = useAgentStore.getState()

  if (msg.toolCall) {
    agentStore.addToolCall(msg.toolCall)
  }

  if (msg.toolResult) {
    agentStore.addToolResult(msg.toolResult.callId, msg.toolResult.result)
  }

  if (msg.error) {
    chatStore.setError(msg.error)
  } else if (msg.done) {
    const completedToolCalls = agentStore.toolCalls
    const completedToolResults = completedToolCalls.map(
      (tc) => agentStore.toolResults.get(tc.id),
    ).filter((r): r is NonNullable<typeof r> => r != null)

    chatStore.finalizeStream({
      content: msg.fullContent,
      toolCalls: completedToolCalls.length > 0 ? completedToolCalls : undefined,
      toolResults: completedToolResults.length > 0 ? completedToolResults : undefined,
    })
    agentStore.resetTurn()
  } else if (msg.delta) {
    chatStore.appendStreamDelta(msg.delta)
  }
}

function setupPort(port: Browser.runtime.Port): () => void {
  const listener = (msg: PortMessage) => handlePortMessage(msg)
  port.onMessage.addListener(listener)
  return () => port.onMessage.removeListener(listener)
}

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
    const cleanup = setupPort(port)

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
    setupPort(port)
    port.onDisconnect.addListener(() => {
      portRef.current = null
    })
    return port
  }, [])

  const send = useCallback(
    async (content: string) => {
      if (useChatStore.getState().isStreaming || !content.trim()) return

      const store = useChatStore.getState()
      useAgentStore.getState().resetTurn()
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

  return { send, messages, streamingContent, isStreaming, error, port: portRef }
}
