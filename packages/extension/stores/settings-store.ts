import { create } from 'zustand'
import type { ModelConfig, LLMProvider } from '../types/chat'

const PROVIDERS: LLMProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyRequired: true,
    models: [
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', providerId: 'anthropic', supportsVision: true, supportsToolCalling: true, maxTokens: 8192 },
      { id: 'claude-opus-4-5-20250918', name: 'Claude Opus 4.5', providerId: 'anthropic', supportsVision: true, supportsToolCalling: true, maxTokens: 8192 },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKeyRequired: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', providerId: 'openai', supportsVision: true, supportsToolCalling: true, maxTokens: 4096 },
      { id: 'gpt-4.1', name: 'GPT-4.1', providerId: 'openai', supportsVision: true, supportsToolCalling: true, maxTokens: 4096 },
      { id: 'o3-mini', name: 'o3-mini', providerId: 'openai', supportsVision: false, supportsToolCalling: true, maxTokens: 4096 },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyRequired: true,
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', providerId: 'google', supportsVision: true, supportsToolCalling: true, maxTokens: 8192 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', providerId: 'google', supportsVision: true, supportsToolCalling: true, maxTokens: 8192 },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434/v1',
    apiKeyRequired: false,
    models: [
      { id: 'llama3', name: 'Llama 3', providerId: 'ollama', supportsVision: false, supportsToolCalling: true, maxTokens: 4096 },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyRequired: true,
    models: [
      { id: 'anthropic/claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 (OpenRouter)', providerId: 'openrouter', supportsVision: true, supportsToolCalling: true, maxTokens: 8192 },
    ],
  },
]

interface SettingsState {
  providers: LLMProvider[]
  activeProvider: string
  activeModel: string

  getApiKey: (provider: string) => Promise<string | undefined>
  setApiKey: (provider: string, key: string) => Promise<void>
  getActiveModel: () => ModelConfig | undefined
  getActiveProvider: () => LLMProvider | undefined
  setActiveModel: (provider: string, modelId: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: PROVIDERS,
  activeProvider: 'anthropic',
  activeModel: 'claude-sonnet-4-5-20250929',

  getApiKey: async (provider) => {
    const result = await chrome.storage.sync.get(`apiKey_${provider}`)
    return result[`apiKey_${provider}`] as string | undefined
  },

  setApiKey: async (provider, key) => {
    await chrome.storage.sync.set({ [`apiKey_${provider}`]: key })
  },

  getActiveModel: () => {
    const { providers, activeProvider, activeModel } = get()
    const provider = providers.find((p) => p.id === activeProvider)
    return provider?.models.find((m) => m.id === activeModel)
  },

  getActiveProvider: () => {
    const { providers, activeProvider } = get()
    return providers.find((p) => p.id === activeProvider)
  },

  setActiveModel: (provider, modelId) => {
    set({ activeProvider: provider, activeModel: modelId })
    chrome.storage.sync.set({ activeProvider: provider, activeModel: modelId })
  },
}))

chrome.storage.sync.get(['activeProvider', 'activeModel']).then((result) => {
  const updates: Partial<Pick<SettingsState, 'activeProvider' | 'activeModel'>> = {}
  if (result.activeProvider) updates.activeProvider = result.activeProvider
  if (result.activeModel) updates.activeModel = result.activeModel
  if (Object.keys(updates).length) useSettingsStore.setState(updates)
})
