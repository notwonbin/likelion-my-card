import { useState } from 'react'
import { Button, StepCard } from './ui'

interface Props {
  /** 필수 항목·형식·명함 영역 모두 통과 */
  ok: boolean
  onBack: () => void
  onConfirm: () => void
  className?: string
}

/** 최종 확인 (왼쪽 카드) — 명함은 오른쪽 카드에 */
export function Confirmation({ ok, onBack, onConfirm, className }: Props) {
  const [agreed, setAgreed] = useState(false)
  return (
    <StepCard
      className={className}
      title="명함 정보를 확인해주세요"
      footer={
        <div className="flex flex-col gap-3">
          <label className={`flex items-center gap-3 rounded-xl bg-fill px-4 py-3.5 text-[14px] ${ok ? 'cursor-pointer' : 'text-faint'}`}>
            <input type="checkbox" className="h-[18px] w-[18px] accent-brand" disabled={!ok} checked={agreed && ok} onChange={(e) => setAgreed(e.target.checked)} />
            철자와 표기가 정확해요
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onBack}>
              수정할게요
            </Button>
            <Button type="button" className="flex-1" disabled={!ok || !agreed} onClick={onConfirm}>
              확정할게요
            </Button>
          </div>
        </div>
      }
    >
      {!ok && (
        <p role="alert" className="rounded-xl bg-[#fdeeec] px-4 py-3 text-[13.5px] font-medium text-danger">
          입력이 덜 된 항목이 있어요.
        </p>
      )}
    </StepCard>
  )
}
