import type { ToolCall, ToolResult } from '../../types/agent'
import { useState } from 'react'

interface Props {
  toolCall: ToolCall
  result?: ToolResult
}

const STATUS_ICONS: Record<ToolCall['status'], string> = {
  'pending-approval': '⏳',
  executing: '⟳',
  completed: '✓',
  rejected: '✗',
  error: '!',
}

const STATUS_COLORS: Record<ToolCall['status'], string> = {
  'pending-approval': 'text-yellow-400',
  executing: 'text-blue-400 animate-spin',
  completed: 'text-green-400',
  rejected: 'text-red-400',
  error: 'text-red-400',
}

export function ToolCallCard({ toolCall, result }: Props) {
  const [expanded, setExpanded] = useState(false)

  const argsStr = JSON.stringify(toolCall.args, null, 2)
  const hasArgs = argsStr !== '{}'

  return (
    <div className="my-1.5 rounded border border-neutral-700 bg-neutral-900 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-neutral-800"
      >
        <span className={STATUS_COLORS[toolCall.status]}>
          {STATUS_ICONS[toolCall.status]}
        </span>
        <span className="rounded bg-neutral-700 px-1.5 py-0.5 font-mono text-neutral-200">
          {toolCall.toolName}
        </span>
        {hasArgs && (
          <span className="truncate text-neutral-500">
            {JSON.stringify(toolCall.args)}
          </span>
        )}
        <span className="ml-auto text-neutral-600">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-700 px-2.5 py-2">
          {hasArgs && (
            <div className="mb-2">
              <div className="mb-1 text-neutral-500">Parameters</div>
              <pre className="overflow-x-auto rounded bg-neutral-950 p-2 text-neutral-300">
                {argsStr}
              </pre>
            </div>
          )}
          {result && (
            <div>
              <div className="mb-1 text-neutral-500">Result</div>
              <pre className="overflow-x-auto rounded bg-neutral-950 p-2 text-neutral-300">
                {JSON.stringify(result.data ?? result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
