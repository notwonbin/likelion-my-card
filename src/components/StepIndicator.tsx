export type Step = 1 | 2 | 3

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: '정보 입력' },
  { n: 2, label: '확인' },
  { n: 3, label: '완료' },
]

/** 상단 전체 단계 표시 — 막대 3개 + 현재 단계명 */
export function StepIndicator({ step }: { step: Step }) {
  const current = STEPS[step - 1]
  return (
    <div className="flex items-center gap-3" aria-label={`제작 단계 ${step}/3: ${current.label}`}>
      <ol className="flex gap-1">
        {STEPS.map((s) => (
          <li
            key={s.n}
            aria-current={s.n === step ? 'step' : undefined}
            className={`h-1 w-6 rounded-full ${s.n <= step ? 'bg-ink' : 'bg-ink/15'}`}
          />
        ))}
      </ol>
    </div>
  )
}
