import { streamText } from 'ai'
import { createModel } from '../lib/ai/client'
import { PROVIDERS } from '../lib/ai/providers'
import type { ChatRequest, ChatStreamChunk, ExtensionMessage } from '../types/messages'

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'chat') {
      port.onMessage.addListener((msg: ExtensionMessage) => {
        if (msg.type === 'CHAT_REQUEST') {
          handleChatRequest(msg, port)
        }
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

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

async function handleChatRequest(request: ChatRequest, port: Browser.runtime.Port) {
  try {
    const provider = PROVIDERS.find((p) => p.id === request.provider)
    if (!provider) {
      sendChunk(port, request.conversationId, '', true, `Unknown provider: ${request.provider}`)
      return
    }

    const apiKey = await getApiKey(request.provider)
    if (!apiKey && provider.apiKeyRequired) {
      sendChunk(port, request.conversationId, '', true, `No API key configured for ${provider.name}. Add one in the options page.`)
      return
    }

    const model = createModel(request.provider, request.model, {
      apiKey: apiKey ?? '',
      baseURL: provider.baseURL,
    })

    const result = streamText({
      model,
      system: request.systemPrompt,
      messages: request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    })

    let fullContent = ''
    for await (const chunk of result.textStream) {
      fullContent += chunk
      sendChunk(port, request.conversationId, chunk, false)
    }

    sendChunk(port, request.conversationId, '', true, undefined, fullContent)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendChunk(port, request.conversationId, '', true, message)
  }
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

async function getApiKey(provider: string): Promise<string | undefined> {
  const result = await chrome.storage.sync.get(`apiKey_${provider}`)
  return result[`apiKey_${provider}`] as string | undefined
}
