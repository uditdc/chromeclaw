import { createModel } from '../lib/ai/client'
import { PROVIDERS } from '../lib/ai/providers'
import { buildSystemPrompt } from '../lib/ai/prompts'
import { runAgentLoop } from '../lib/agent/loop'
import { handleApprovalResponse, rejectAllPending } from '../lib/agent/tool-approval'
import type {
  ChatRequest,
  ChatStreamChunk,
  ExtensionMessage,
} from '../types/messages'
import type { AutonomyLevel, ToolCall, ToolResult } from '../types/agent'
import type { PageContext } from '../types/context'

import '../lib/tools/demos'

const contextCache = new Map<
  number,
  { context: PageContext; timestamp: number }
>()
const CONTEXT_TTL = 60_000

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'chat') {
      port.onMessage.addListener((msg: ExtensionMessage) => {
        if (msg.type === 'CHAT_REQUEST') {
          handleChatRequest(msg, port)
        }
        if (msg.type === 'TOOL_APPROVAL_RESPONSE') {
          handleApprovalResponse(msg)
        }
      })

      port.onDisconnect.addListener(() => {
        rejectAllPending()
      })
    }
  })

  browser.runtime.onMessage.addListener(
    (msg: ExtensionMessage, _sender, sendResponse) => {
      if (msg.type === 'VERIFY_API_KEY') {
        verifyApiKey(msg.providerId, msg.apiKey, msg.baseURL).then(sendResponse)
        return true
      }
      return false
    },
  )

  chrome.tabs.onRemoved.addListener((tabId) => {
    contextCache.delete(tabId)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      contextCache.delete(tabId)
    }
  })

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

async function handleChatRequest(
  request: ChatRequest,
  port: Browser.runtime.Port,
) {
  try {
    const provider = PROVIDERS.find((p) => p.id === request.provider)
    if (!provider) {
      sendChunk(port, request.conversationId, '', true, `Unknown provider: ${request.provider}`)
      return
    }

    const apiKey = await getApiKey(request.provider)
    if (!apiKey && provider.apiKeyRequired) {
      sendChunk(
        port,
        request.conversationId,
        '',
        true,
        `No API key configured for ${provider.name}. Add one in the options page.`,
      )
      return
    }

    const model = createModel(request.provider, request.model, {
      apiKey: apiKey ?? '',
      baseURL: provider.baseURL,
    })

    const pageContext = await getActiveTabContext()
    const systemPrompt = buildSystemPrompt({ pageContext })
    const autonomyLevel = await getAutonomyLevel()

    await runAgentLoop({
      model,
      systemPrompt,
      messages: request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      autonomyLevel,
      maxSteps: 10,
      port,
      onTextDelta(delta) {
        sendChunk(port, request.conversationId, delta, false)
      },
      onToolCall(toolCall) {
        sendToolCallChunk(port, request.conversationId, toolCall)
      },
      onToolResult(callId, result) {
        sendToolResultChunk(port, request.conversationId, callId, result)
      },
      onDone(fullContent) {
        sendChunk(port, request.conversationId, '', true, undefined, fullContent)
      },
      onError(error) {
        sendChunk(port, request.conversationId, '', true, error)
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendChunk(port, request.conversationId, '', true, message)
  }
}

async function getActiveTabContext(): Promise<PageContext | undefined> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return undefined
    return getPageContext(tab.id)
  } catch {
    return undefined
  }
}

async function getPageContext(
  tabId: number,
): Promise<PageContext | undefined> {
  const cached = contextCache.get(tabId)
  if (cached && Date.now() - cached.timestamp < CONTEXT_TTL) {
    return cached.context
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'EXTRACT_PAGE',
      options: {
        includeMetadata: true,
        includeStructured: true,
        maxTokens: 4000,
      },
    })
    if (response?.context) {
      const context: PageContext = { ...response.context, tabId }
      contextCache.set(tabId, { context, timestamp: Date.now() })
      return context
    }
  } catch {
    // Tab may not have content script injected
  }
  return undefined
}

async function getAutonomyLevel(): Promise<AutonomyLevel> {
  try {
    const result = await chrome.storage.sync.get('autonomyLevel')
    return (result.autonomyLevel as AutonomyLevel) ?? 'full-auto'
  } catch {
    return 'full-auto'
  }
}

function sendChunk(
  port: Browser.runtime.Port,
  conversationId: string,
  delta: string,
  done: boolean,
  error?: string,
  fullContent?: string,
) {
  const chunk: ChatStreamChunk = {
    type: 'CHAT_STREAM_CHUNK',
    conversationId,
    delta,
    done,
  }
  if (error) chunk.error = error
  if (fullContent) chunk.fullContent = fullContent
  port.postMessage(chunk)
}

function sendToolCallChunk(
  port: Browser.runtime.Port,
  conversationId: string,
  toolCall: ToolCall,
) {
  const chunk: ChatStreamChunk = {
    type: 'CHAT_STREAM_CHUNK',
    conversationId,
    delta: '',
    done: false,
    toolCall,
  }
  port.postMessage(chunk)
}

function sendToolResultChunk(
  port: Browser.runtime.Port,
  conversationId: string,
  callId: string,
  result: ToolResult,
) {
  const chunk: ChatStreamChunk = {
    type: 'CHAT_STREAM_CHUNK',
    conversationId,
    delta: '',
    done: false,
    toolResult: { callId, result },
  }
  port.postMessage(chunk)
}

async function verifyApiKey(
  providerId: string,
  apiKey: string,
  baseURL: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseURL}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    })
    if (response.ok) return { valid: true }
    const text = await response.text()
    return { valid: false, error: `${response.status}: ${text.slice(0, 200)}` }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

async function getApiKey(provider: string): Promise<string | undefined> {
  const result = await chrome.storage.sync.get(`apiKey_${provider}`)
  return result[`apiKey_${provider}`] as string | undefined
}
