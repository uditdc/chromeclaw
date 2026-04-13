import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import type { LLMProvider } from '../../types/chat'
import type { VerifyApiKeyRequest } from '../../types/messages'

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

interface Props {
  provider: LLMProvider
  onValidated?: (valid: boolean) => void
}

export function ApiKeyInput({ provider, onValidated }: Props) {
  const { getApiKey, setApiKey, removeApiKey } = useSettingsStore()
  const [key, setKey] = useState('')
  const [savedKey, setSavedKey] = useState<string | undefined>()
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<ValidationStatus>('idle')
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    getApiKey(provider.id).then((k) => {
      if (k) {
        setSavedKey(k)
        setKey(k)
        setStatus('valid')
      }
    })
  }, [provider.id, getApiKey])

  const verify = async () => {
    const keyToVerify = key.trim()
    if (!keyToVerify && provider.apiKeyRequired) return

    setStatus('validating')
    setError(undefined)

    const msg: VerifyApiKeyRequest = {
      type: 'VERIFY_API_KEY',
      providerId: provider.id,
      apiKey: keyToVerify,
      baseURL: provider.baseURL,
    }

    const result: { valid: boolean; error?: string } =
      await browser.runtime.sendMessage(msg)

    if (result.valid) {
      setStatus('valid')
      await setApiKey(provider.id, keyToVerify)
      setSavedKey(keyToVerify)
      onValidated?.(true)
    } else {
      setStatus('invalid')
      setError(result.error)
      onValidated?.(false)
    }
  }

  const clear = async () => {
    await removeApiKey(provider.id)
    setKey('')
    setSavedKey(undefined)
    setStatus('idle')
    setError(undefined)
  }

  const hasUnsavedChanges = key.trim() !== (savedKey ?? '')

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{provider.name}</span>
          {status === 'valid' && (
            <span className="text-xs text-green-400">Connected</span>
          )}
        </div>
        {savedKey && (
          <button
            onClick={clear}
            className="text-xs text-neutral-500 hover:text-red-400"
          >
            Remove
          </button>
        )}
      </div>

      {provider.apiKeyRequired ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={visible ? 'text' : 'password'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                if (status !== 'idle') setStatus('idle')
              }}
              placeholder={`${provider.name} API key`}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 pr-16 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => setVisible(!visible)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            onClick={verify}
            disabled={!key.trim() || status === 'validating' || (!hasUnsavedChanges && status === 'valid')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            {status === 'validating' ? 'Checking…' : hasUnsavedChanges ? 'Verify' : 'Verified'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={provider.baseURL}
            disabled
            className="flex-1 rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-400"
          />
          <button
            onClick={verify}
            disabled={status === 'validating'}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            {status === 'validating' ? 'Checking…' : status === 'valid' ? 'Connected' : 'Test'}
          </button>
        </div>
      )}

      {status === 'invalid' && error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
