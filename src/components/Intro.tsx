import { useEffect, useState } from 'react'
import logoSvg from '../assets/card/logo-wordmark.svg?raw'
import lionMp4 from '../assets/motion/cover-lion.mp4'
import lionFirst from '../assets/motion/cover-lion-first.webp'
import lionLast from '../assets/motion/cover-lion-last.webp'
import { STEP_CARD_HEIGHT, StepCard } from './ui'

/** 명함이 필요한 이유 — 추후 제작 신청 기록에 함께 남긴다 */
export const REASONS = ['새로 입사했어요', '명함을 모두 사용했어요', '소속이나 직책이 변경됐어요', '명함 정보가 변경됐어요'] as const
export type Reason = (typeof REASONS)[number]

/** 움직임 줄이기 설정 존중 */
function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(q).matches)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setReduced(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduced
}

/**
 * 시작 화면 왼쪽 커버 — 원본 명함의 검정, 로고(원본 벡터), 사자 모션(모션.mp4)
 * 모션은 정방향→역방향으로 이어 붙인 영상을 반복 재생해 끊김 없이 순환한다.
 * 영상의 검정 배경은 mix-blend-mode: lighten 으로 카드 배경(#231F20)에 녹인다.
 */
/** onStart: 모바일에서 카드를 누르면 이유 선택으로 (데스크톱은 오른쪽 카드에서 바로 고르므로 무시) */
export function IntroCover({ onStart }: { onStart?: () => void }) {
  const reduced = usePrefersReducedMotion()
  return (
    <section
      aria-label="멋쟁이사자처럼 명함 만들기"
      onClick={() => {
        if (onStart && !window.matchMedia('(min-width: 1024px)').matches) onStart()
      }}
      className={`relative flex flex-col overflow-hidden max-lg:cursor-pointer rounded-[20px] bg-[#231f20] p-6 text-white sm:p-8 ${STEP_CARD_HEIGHT}`}
    >
      {/* 배경: 위(문구)는 원본 명함의 검정 #231F20, 아래(사자)로 갈수록 더 깊은 검정 —
          영상은 lighten 으로 합성되므로 사자의 눈·코(원본 순수 검정)가 배경색으로 들뜨지 않게 한다.
          주황빛은 얼굴이 아니라 명함을 든 손 뒤에만 둔다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(42% 24% at 40% 93%, rgba(243,112,37,.26), rgba(243,112,37,0) 72%), linear-gradient(180deg, #231f20 0%, #1a1718 34%, #0b0a0a 58%, #050404 100%)',
        }}
      />
      {/* 사자 모션 — 시선이 오른쪽이라 왼쪽에 두고 오른쪽 여백 확보, 다리 쪽은 카드 아래에서 트리밍 */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[9%] aspect-[2/3] w-[66%] translate-y-[22%] mix-blend-lighten max-lg:left-[10%] max-lg:w-[min(80%,46dvh)] max-lg:translate-y-[16%]"
      >
        {reduced ? (
          <img src={lionLast} alt="" className="h-full w-full object-contain" />
        ) : (
          <video src={lionMp4} poster={lionFirst} autoPlay loop muted playsInline preload="auto" className="h-full w-full object-contain" />
        )}
      </div>

      <span
        role="img"
        aria-label="멋쟁이사자처럼"
        className="relative block w-[132px] text-white [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: logoSvg }}
      />
      <h1 className="relative mt-7 text-[25px] font-bold leading-[1.45] tracking-[-0.025em] sm:text-[27px]">
        처음 나를 소개하던 설렘이
        <br />
        오늘도 이어지길 바랍니다.
      </h1>
    </section>
  )
}

/** 시작 화면 오른쪽 — 명함이 필요한 이유 */
export function ReasonCard({ badge, onSelect }: { badge: string; onSelect: (r: Reason) => void }) {
  return (
    <StepCard
      className={STEP_CARD_HEIGHT}
      badge={badge}
      title={
        <>
          어떤 이유로 명함이
          <br />
          필요하세요?
        </>
      }
      footer={
        <ul className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex h-[54px] w-full items-center justify-between rounded-xl bg-fill px-5 text-left text-[15px] font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                {r}
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="text-faint">
                  <path
                    d="M6 3.5L10.5 8 6 12.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      }
    />
  )
}
