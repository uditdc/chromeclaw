import type { ToolApprovalRequest, ToolApprovalResponse } from '../../types/messages'

const pendingApprovals = new Map<
  string,
  { resolve: (approved: boolean) => void }
>()

export function requestApproval(
  port: Browser.runtime.Port,
  callId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<boolean> {
  return new Promise((resolve) => {
    pendingApprovals.set(callId, { resolve })
    const request: ToolApprovalRequest = {
      type: 'TOOL_APPROVAL_REQUEST',
      callId,
      toolName,
      args,
      description: `Run ${toolName}`,
    }
    port.postMessage(request)
  })
}

export function handleApprovalResponse(response: ToolApprovalResponse) {
  const pending = pendingApprovals.get(response.callId)
  if (pending) {
    pending.resolve(response.approved)
    pendingApprovals.delete(response.callId)
  }
}

export function rejectAllPending() {
  for (const [, { resolve }] of pendingApprovals) {
    resolve(false)
  }
  pendingApprovals.clear()
}
