import { useContextStore } from '../../stores/context-store'

export function ElementPickerToggle() {
  const { isPickerActive, toggleElementPicker } = useContextStore()

  return (
    <button
      onClick={toggleElementPicker}
      className={`rounded p-1.5 text-xs transition-colors ${
        isPickerActive
          ? 'bg-blue-600 text-white'
          : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200'
      }`}
      title={isPickerActive ? 'Cancel element selection' : 'Select page element'}
    >
      ⊕
    </button>
  )
}
