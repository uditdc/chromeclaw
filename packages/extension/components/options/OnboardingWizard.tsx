import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { ApiKeyInput } from './ApiKeyInput'
import type { LLMProvider } from '../../types/chat'

type Step = 'welcome' | 'provider' | 'done'

export function OnboardingWizard() {
  const { providers, setActiveModel, completeOnboarding } = useSettingsStore()
  const [step, setStep] = useState<Step>('welcome')
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null)
  const [keyValid, setKeyValid] = useState(false)

  const finish = async () => {
    if (selectedProvider?.models[0]) {
      setActiveModel(selectedProvider.id, selectedProvider.models[0].id)
    }
    await completeOnboarding()
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-md px-6">
        {step === 'welcome' && (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">Welcome to ChromeClaw</h1>
            <p className="mb-8 text-sm text-neutral-400">
              Your AI agent, native in the browser. Connect a provider to get started.
            </p>

            <div className="mb-8 space-y-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProvider(p)
                    if (!p.apiKeyRequired) {
                      setKeyValid(true)
                    }
                    setStep('provider')
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left text-sm hover:border-neutral-700 hover:bg-neutral-800/80"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-neutral-500">
                    {p.apiKeyRequired ? 'API key' : 'Local'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'provider' && selectedProvider && (
          <div>
            <button
              onClick={() => {
                setStep('welcome')
                setKeyValid(false)
              }}
              className="mb-6 text-xs text-neutral-500 hover:text-neutral-300"
            >
              &larr; Back
            </button>

            <h2 className="mb-2 text-lg font-semibold">
              Set up {selectedProvider.name}
            </h2>
            <p className="mb-6 text-sm text-neutral-400">
              {selectedProvider.apiKeyRequired
                ? `Enter your ${selectedProvider.name} API key to connect.`
                : `${selectedProvider.name} runs locally — just verify the connection.`}
            </p>

            <ApiKeyInput
              provider={selectedProvider}
              onValidated={setKeyValid}
            />

            <button
              onClick={() => setStep('done')}
              disabled={!keyValid}
              className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="mb-4 text-4xl">&#10003;</div>
            <h2 className="mb-2 text-lg font-semibold">You're all set</h2>
            <p className="mb-8 text-sm text-neutral-400">
              ChromeClaw is ready. Open the side panel to start chatting.
            </p>

            <button
              onClick={finish}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              Open ChromeClaw
            </button>

            <p className="mt-4 text-xs text-neutral-500">
              You can add more providers later in Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
