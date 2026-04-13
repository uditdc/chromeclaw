import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

export function createModel(
  providerId: string,
  modelId: string,
  config: { apiKey: string; baseURL: string },
): LanguageModel {
  const provider = createOpenAICompatible({
    name: providerId,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  })
  return provider.chatModel(modelId)
}
