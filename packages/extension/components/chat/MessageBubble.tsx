import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import { StreamingIndicator } from './StreamingIndicator'

interface Props {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  model?: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, model, isStreaming }: Props) {
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
        {content ? (
          isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )
        ) : isStreaming ? (
          <StreamingIndicator />
        ) : null}

        {model && !isUser && (
          <p className="mt-1 text-[10px] text-neutral-500">{model}</p>
        )}
      </div>
    </div>
  )
}
