import { useSettingsStore } from '../../stores/settings-store'

export function ModelDefaults() {
  const { providers, activeProvider, activeModel, setActiveModel } =
    useSettingsStore()

  const currentProvider = providers.find((p) => p.id === activeProvider)

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-neutral-400">
            Provider
          </label>
          <select
            value={activeProvider}
            onChange={(e) => {
              const provider = providers.find((p) => p.id === e.target.value)
              if (provider?.models[0]) {
                setActiveModel(provider.id, provider.models[0].id)
              }
            }}
            className="w-full rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:ring-1 focus:ring-blue-500"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-neutral-400">
            Model
          </label>
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(activeProvider, e.target.value)}
            className="w-full rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:ring-1 focus:ring-blue-500"
          >
            {currentProvider?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
