import { create } from 'zustand'
import type { ModelConfig, LLMProvider } from '../types/chat'
import { PROVIDERS } from '../lib/ai/providers'

interface SettingsState {
  providers: LLMProvider[]
  activeProvider: string
  activeModel: string
  hasCompletedOnboarding: boolean

  getApiKey: (provider: string) => Promise<string | undefined>
  setApiKey: (provider: string, key: string) => Promise<void>
  removeApiKey: (provider: string) => Promise<void>
  getActiveModel: () => ModelConfig | undefined
  getActiveProvider: () => LLMProvider | undefined
  setActiveModel: (provider: string, modelId: string) => void
  checkOnboarding: () => Promise<boolean>
  completeOnboarding: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: PROVIDERS,
  activeProvider: 'openrouter',
  activeModel: 'google/gemma-4-31b-it:free',
  hasCompletedOnboarding: false,

  getApiKey: async (provider) => {
    const result = await chrome.storage.sync.get(`apiKey_${provider}`)
    return result[`apiKey_${provider}`] as string | undefined
  },

  setApiKey: async (provider, key) => {
    await chrome.storage.sync.set({ [`apiKey_${provider}`]: key })
  },

  removeApiKey: async (provider) => {
    await chrome.storage.sync.remove(`apiKey_${provider}`)
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

  checkOnboarding: async () => {
    const result = await chrome.storage.sync.get('hasCompletedOnboarding')
    const completed = result.hasCompletedOnboarding === true
    set({ hasCompletedOnboarding: completed })
    return completed
  },

  completeOnboarding: async () => {
    await chrome.storage.sync.set({ hasCompletedOnboarding: true })
    set({ hasCompletedOnboarding: true })
  },
}))

chrome.storage.sync
  .get(['activeProvider', 'activeModel', 'hasCompletedOnboarding'])
  .then((result) => {
    const updates: Partial<SettingsState> = {}
    if (result.activeProvider) updates.activeProvider = result.activeProvider
    if (result.activeModel) updates.activeModel = result.activeModel
    if (result.hasCompletedOnboarding) updates.hasCompletedOnboarding = true
    if (Object.keys(updates).length) useSettingsStore.setState(updates)
  })
