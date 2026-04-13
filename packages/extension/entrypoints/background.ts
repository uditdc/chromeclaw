import { streamText } from 'ai'
import { createModel } from '../lib/ai/client'
import type { LLMProvider } from '../types/chat'
import type { ChatRequest, ChatStreamChunk, ExtensionMessage } from '../types/messages'

const PROVIDERS: LLMProvider[] = [
  { id: 'anthropic', name: 'Anthropic', baseURL: 'https://api.anthropic.com/v1', apiKeyRequired: true, models: [] },
  { id: 'openai', name: 'OpenAI', baseURL: 'https://api.openai.com/v1', apiKeyRequired: true, models: [] },
  { id: 'google', name: 'Google', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKeyRequired: true, models: [] },
  { id: 'ollama', name: 'Ollama', baseURL: 'http://localhost:11434/v1', apiKeyRequired: false, models: [] },
  { id: 'openrouter', name: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', apiKeyRequired: true, models: [] },
]

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
    (msg: ExtensionMessage, _sender, _sendResponse) => {
      switch (msg.type) {
        case 'EXTRACT_PAGE':
        case 'ELEMENT_PICKER_RESULT':
        case 'TOOL_APPROVAL_RESPONSE':
        case 'EXTRACTION_RESULT':
          break
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

    for await (const chunk of result.textStream) {
      sendChunk(port, request.conversationId, chunk, false)
    }

    sendChunk(port, request.conversationId, '', true)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendChunk(port, request.conversationId, '', true, message)
  }
}

function sendChunk(
  port: Browser.runtime.Port,
  conversationId: string,
  delta: string,
  done: boolean,
  error?: string,
) {
  const chunk: ChatStreamChunk & { error?: string } = {
    type: 'CHAT_STREAM_CHUNK',
    conversationId,
    delta,
    done,
  }
  if (error) chunk.error = error
  port.postMessage(chunk)
}

async function getApiKey(provider: string): Promise<string | undefined> {
  const result = await chrome.storage.sync.get(`apiKey_${provider}`)
  return result[`apiKey_${provider}`] as string | undefined
}
