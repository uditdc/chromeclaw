import { useSettingsStore } from '../../stores/settings-store'
import { useChatStore } from '../../stores/chat-store'

export function ModelSwitcher() {
  const { providers, activeProvider, activeModel, setActiveModel } = useSettingsStore()
  const { switchModel } = useChatStore()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [provider, model] = e.target.value.split('::')
    setActiveModel(provider as typeof activeProvider, model)
    switchModel(provider, model)
  }

  return (
    <select
      value={`${activeProvider}::${activeModel}`}
      onChange={handleChange}
      className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300 outline-none focus:ring-1 focus:ring-blue-500"
    >
      {providers.map((p) =>
        p.models.map((m) => (
          <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
            {m.name}
          </option>
        )),
      )}
    </select>
  )
}
