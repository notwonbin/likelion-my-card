import { CardFace, type OverflowMap } from '../card/CardFace'
import type { CardData, CardSide } from '../card/types'

interface Props {
  data: CardData
  /** 빈 항목에 흐리게 보여줄 예시 */
  ghost?: CardData
  /** 보여줄 면 — 만드는 중·확인: 정보 면만 / 완성: 그래픽 면 위, 정보 면 아래 */
  faces?: CardSide[]
  onOverflow?: (o: OverflowMap) => void
  /** 진행 표시 (예: 2 of 4) — 시작 화면과 같은 자리(오른쪽 큰 카드 위)에 */
  badge?: string
}

const SHADOW = 'shadow-[0_2px_4px_rgba(0,0,0,.06),0_18px_40px_-14px_rgba(0,0,0,.26)]'

/** 오른쪽 명함 카드 — 모든 단계에서 같은 크기 */
export function BusinessCardPreview({ data, ghost, faces = ['front'], onOverflow, badge }: Props) {
  const both = faces.length > 1
  return (
    <section
      aria-label="명함 미리보기"
      className={`relative flex h-full flex-col justify-center rounded-[20px] bg-white p-6 sm:p-8 ${badge ? 'pt-14 sm:pt-16 lg:pt-8' : ''}`}
    >
      {badge && (
        <span className="absolute right-6 top-6 rounded-full bg-fill px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-ink/70 sm:right-8 sm:top-8">
          {badge}
        </span>
      )}
      <div className={`mx-auto flex w-full flex-col gap-4 py-6 lg:py-0 ${both ? 'max-w-[380px]' : 'max-w-[480px]'}`}>
        {faces.map((side) => (
          <div key={side} className={SHADOW}>
            <CardFace
              side={side}
              data={data}
              ghost={side === 'front' ? ghost : undefined}
              onOverflow={side === 'front' ? onOverflow : undefined}
              title={side === 'back' ? '명함 그래픽 면' : '명함 정보 면'}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
