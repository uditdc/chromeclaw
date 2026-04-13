import type { ToolApprovalRequest } from '../../types/messages'

interface Props {
  request: ToolApprovalRequest
  onRespond: (approved: boolean) => void
}

export function ApprovalDialog({ request, onRespond }: Props) {
  const argsStr = JSON.stringify(request.args, null, 2)

  return (
    <div className="mx-3 mb-2 rounded-lg border border-yellow-800/50 bg-yellow-950/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="text-yellow-400">⏳</span>
        <span className="font-medium text-yellow-300">Tool approval required</span>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-neutral-700 px-1.5 py-0.5 font-mono text-xs text-neutral-200">
          {request.toolName}
        </span>
      </div>

      {argsStr !== '{}' && (
        <pre className="mb-3 overflow-x-auto rounded bg-neutral-950 p-2 text-xs text-neutral-300">
          {argsStr}
        </pre>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onRespond(true)}
          autoFocus
          className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
        >
          Allow
        </button>
        <button
          onClick={() => onRespond(false)}
          className="rounded bg-neutral-700 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-600"
        >
          Deny
        </button>
      </div>
    </div>
  )
}
