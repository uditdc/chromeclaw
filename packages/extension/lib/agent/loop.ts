import { streamText, stepCountIs } from 'ai'
import type { LanguageModel, ToolSet } from 'ai'
import * as registry from '../tools/registry'
import { shouldRequestApproval } from './autonomy'
import { requestApproval } from './tool-approval'
import type { AutonomyLevel, ToolCall, ToolResult } from '../../types/agent'

interface AgentLoopOptions {
  model: LanguageModel
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  autonomyLevel: AutonomyLevel
  maxSteps: number
  port: Browser.runtime.Port
  onTextDelta: (delta: string) => void
  onToolCall: (toolCall: ToolCall) => void
  onToolResult: (callId: string, result: ToolResult) => void
  onDone: (fullContent: string) => void
  onError: (error: string) => void
}

export async function runAgentLoop(options: AgentLoopOptions) {
  const {
    model,
    systemPrompt,
    messages,
    autonomyLevel,
    maxSteps,
    port,
  } = options

  const allTools = registry.getAll()
  const wrappedTools: ToolSet = {}

  for (const def of allTools) {
    (wrappedTools as any)[def.name] = {
      description: def.description,
      inputSchema: def.inputSchema,
      execute: async (params: unknown) => {
        if (shouldRequestApproval(def, autonomyLevel)) {
          const callId = crypto.randomUUID()
          const approved = await requestApproval(
            port,
            callId,
            def.name,
            params as Record<string, unknown>,
          )

          if (!approved) {
            return { success: false, data: null, error: 'User rejected this tool call' }
          }
        }

        return def.execute(params)
      },
    }
  }

  try {
    const hasTools = Object.keys(wrappedTools).length > 0

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      ...(hasTools
        ? { tools: wrappedTools, stopWhen: stepCountIs(maxSteps) }
        : {}),
    })

    let fullContent = ''

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta': {
          const delta = 'text' in part ? part.text : (part as any).delta
          if (delta) {
            fullContent += delta
            options.onTextDelta(delta)
          }
          break
        }

        case 'tool-call': {
          const toolCall: ToolCall = {
            id: part.toolCallId,
            toolName: part.toolName,
            args: ('input' in part ? part.input : (part as any).args) as Record<string, unknown>,
            status: 'executing',
          }
          options.onToolCall(toolCall)
          break
        }

        case 'tool-result': {
          const output = 'output' in part ? part.output : (part as any).result
          const toolResult: ToolResult = {
            success: true,
            data: output,
          }
          options.onToolResult(part.toolCallId, toolResult)
          break
        }
      }
    }

    options.onDone(fullContent)
  } catch (err) {
    options.onError(err instanceof Error ? err.message : 'Agent loop failed')
  }
}
