import { useRef, useEffect } from 'react'
import { useChatStream } from '../../hooks/use-chat-stream'
import { useAgentStore } from '../../stores/agent-store'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ToolCallCard } from '../agent/ToolCallCard'
import { ApprovalDialog } from '../agent/ApprovalDialog'
import { ContextPanel } from '../context/ContextPanel'
import { ElementPickerToggle } from '../context/ElementPickerToggle'

export function ChatView() {
  const { send, messages, streamingContent, isStreaming, error, port } =
    useChatStream()
  const bottomRef = useRef<HTMLDivElement>(null)
  const toolCalls = useAgentStore((s) => s.toolCalls)
  const toolResults = useAgentStore((s) => s.toolResults)
  const pendingApproval = useAgentStore((s) => s.pendingApproval)
  const respondToApproval = useAgentStore((s) => s.respondToApproval)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, toolCalls])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-neutral-500">Start a conversation</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            model={msg.model}
            toolCalls={msg.toolCalls}
            toolResults={msg.toolResults}
          />
        ))}

        {isStreaming && toolCalls.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100">
              {toolCalls.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} result={toolResults.get(tc.id)} />
              ))}
            </div>
          </div>
        )}

        {isStreaming && streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {isStreaming && !streamingContent && toolCalls.length === 0 && (
          <MessageBubble role="assistant" content="" isStreaming />
        )}

        {error && (
          <div className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {pendingApproval && (
        <ApprovalDialog
          request={pendingApproval}
          onRespond={(approved) =>
            respondToApproval(pendingApproval.callId, approved, port.current)
          }
        />
      )}

      <ContextPanel />

      <div className="flex items-end gap-1 border-t border-neutral-800">
        <div className="flex-1">
          <ChatInput onSend={send} disabled={isStreaming} />
        </div>
        <div className="pb-2 pr-2">
          <ElementPickerToggle />
        </div>
      </div>
    </div>
  )
}
