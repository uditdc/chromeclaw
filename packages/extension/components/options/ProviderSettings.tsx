import { useSettingsStore } from '../../stores/settings-store'
import { ApiKeyInput } from './ApiKeyInput'

export function ProviderSettings() {
  const providers = useSettingsStore((s) => s.providers)

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <ApiKeyInput key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
