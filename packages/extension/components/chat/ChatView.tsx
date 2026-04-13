import { useRef, useEffect, useState } from 'react'
import { useChatStream } from '../../hooks/use-chat-stream'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ExportDialog } from './ExportDialog'
import { useChatStore } from '../../stores/chat-store'

export function ChatView() {
  const { send, messages, streamingContent, isStreaming, error } = useChatStream()
  const conversation = useChatStore((s) => s.conversation)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex h-full flex-col">
      {conversation && messages.length > 0 && (
        <div className="flex justify-end border-b border-neutral-800 px-3 py-1">
          <button
            onClick={() => setShowExport(true)}
            className="text-[10px] text-neutral-500 hover:text-neutral-300"
          >
            Export
          </button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-neutral-500">
              Start a conversation
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            model={msg.model}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {error && (
          <div className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={send} disabled={isStreaming} />

      {showExport && conversation && (
        <ExportDialog
          messages={messages}
          title={conversation.title}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
