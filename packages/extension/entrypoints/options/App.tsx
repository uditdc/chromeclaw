import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { OnboardingWizard } from '../../components/options/OnboardingWizard'
import { ProviderSettings } from '../../components/options/ProviderSettings'
import { ModelDefaults } from '../../components/options/ModelDefaults'

export default function App() {
  const { hasCompletedOnboarding, checkOnboarding } = useSettingsStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboarding().then(() => setLoading(false))
  }, [checkOnboarding])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-950 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />
  }

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-8 text-xl font-semibold">ChromeClaw Settings</h1>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium text-neutral-400 uppercase tracking-wide">
            API Keys
          </h2>
          <ProviderSettings />
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Default Model
          </h2>
          <ModelDefaults />
        </section>
      </div>
    </div>
  )
}
