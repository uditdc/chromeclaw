interface Props {
  currentStep: number
  maxSteps: number
}

export function AgentStepIndicator({ currentStep, maxSteps }: Props) {
  if (currentStep <= 0) return null

  return (
    <span className="inline-flex items-center rounded-full bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium text-blue-300">
      Step {currentStep}/{maxSteps}
    </span>
  )
}
