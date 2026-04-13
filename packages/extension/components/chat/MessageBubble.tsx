import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { StreamingIndicator } from './StreamingIndicator'
import { ToolCallCard } from '../agent/ToolCallCard'
import type { ToolCall, ToolResult } from '../../types/agent'

interface Props {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  model?: string
  isStreaming?: boolean
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

export function MessageBubble({
  role,
  content,
  model,
  isStreaming,
  toolCalls,
  toolResults,
}: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-neutral-800 text-neutral-100'
        }`}
      >
        {toolCalls && toolCalls.length > 0 && (
          <div className="mb-1">
            {toolCalls.map((tc, i) => (
              <ToolCallCard
                key={tc.id}
                toolCall={tc}
                result={toolResults?.[i]}
              />
            ))}
          </div>
        )}

        {content ? (
          isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )
        ) : isStreaming ? (
          <StreamingIndicator />
        ) : null}
      </div>
    </div>
  )
}
