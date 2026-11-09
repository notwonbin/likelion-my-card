import { StepIndicator, type Step } from './StepIndicator'

export function Header({ step }: { step: Step }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-6">
      <span className="text-[15px] font-bold tracking-[-0.01em]">멋쟁이사자처럼 My Card</span>
      <StepIndicator step={step} />
    </header>
  )
}
