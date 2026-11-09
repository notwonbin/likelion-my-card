import { useCallback, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import type { Step } from './components/StepIndicator'
import { InformationForm } from './components/InformationForm'
import { BusinessCardPreview } from './components/BusinessCardPreview'
import { Confirmation } from './components/Confirmation'
import { Completion } from './components/Completion'
import { STEP_CARD_HEIGHT } from './components/ui'
import { IntroCover, ReasonCard, type Reason } from './components/Intro'
import { EMPTY_DATA, SAMPLE_DATA } from './card/format'
import { EMPTY_ORG, type OrgSelection } from './components/OrgPicker'
import { validate } from './card/validation'
import { useCardFonts } from './card/useCardFonts'
import { clampToFit, fits } from './card/typeset'
import type { OverflowMap } from './card/CardFace'
import type { CardData, FieldKey, TextFieldKey } from './card/types'

export default function App() {
  const [step, setStep] = useState<Step>(1)
  const [sub, setSub] = useState(0)
  /** 시작 화면에서 고른 명함 신청 사유 (null = 시작 화면) — 추후 제작 신청 기록에 사용 */
  const [reason, setReason] = useState<Reason | null>(null)
  const [data, setData] = useState<CardData>(EMPTY_DATA)
  const [org, setOrg] = useState<OrgSelection>(EMPTY_ORG)
  const [overflowRaw, setOverflowRaw] = useState<OverflowMap>({})
  const [formKey, setFormKey] = useState(0)
  const fonts = useCardFonts()

  const errors = useMemo(() => validate(data), [data])
  const intro = step === 1 && reason === null

  // 우측 칼럼 행(소속1·소속2·직책 중 입력된 것) → 입력 필드로 매핑
  const overflow = useMemo(() => {
    const o: Partial<Record<FieldKey, boolean>> = {
      nameEn: overflowRaw.nameEn,
      nameKo: overflowRaw.nameKo,
      emailId: overflowRaw.email,
      phone: overflowRaw.phone,
    }
    // 우측 칼럼: 마지막 줄이 직책, 나머지는 소속(자동 줄바꿈)
    const rights = (['right0', 'right1', 'right2'] as const).filter((r) => overflowRaw[r] !== undefined)
    rights.forEach((r, i) => {
      const k = i === rights.length - 1 ? 'title' : 'affiliation'
      o[k] = o[k] || overflowRaw[r]
    })
    return o
  }, [overflowRaw, data])
  const hasOverflow = Object.values(overflow).some(Boolean)

  const onOverflow = useCallback((o: OverflowMap) => {
    setOverflowRaw((prev) => (JSON.stringify(prev) === JSON.stringify(o) ? prev : o))
  }, [])

  // 명함 영역을 넘는 입력은 받지 않는다 (한글 조합 중에는 조합이 끝난 뒤 판단)
  const [limitHit, setLimitHit] = useState<Partial<Record<FieldKey, number>>>({})
  const timers = useRef<Partial<Record<FieldKey, ReturnType<typeof setTimeout>>>>({})
  const flashLimit = (k: FieldKey) => {
    setLimitHit((m) => ({ ...m, [k]: Date.now() }))
    clearTimeout(timers.current[k])
    timers.current[k] = setTimeout(() => setLimitHit((m) => ({ ...m, [k]: undefined })), 2200)
  }
  // 명함 영역 한도 처리
  //  - 한 글자씩 입력하다 넘치면: 그 입력을 받지 않는다 (가운데에 끼워 넣어도 다른 글자는 그대로)
  //  - 붙여넣기·한글 조합 완료로 한 번에 넘치면: 들어가는 만큼만 남긴다
  //  - 한도에 닿은 뒤에는 글자를 지우기 전까지 더 길어지는 입력을 받지 않는다
  //    (좁은 글자만 끼어들어 'STRATEGY ANDE' 같은 조각이 생기는 것 방지)
  const locks = useRef<Partial<Record<FieldKey, number>>>({})
  const change = (patch: Partial<CardData>, composing = false, composed = false) => {
    let next = { ...data, ...patch }
    if (!composing && fonts.ready) {
      for (const key of Object.keys(patch) as (keyof CardData)[]) {
        const k = key as TextFieldKey
        const len = (v: string) => Array.from(v).length
        const lockLen = locks.current[k]
        if (lockLen !== undefined && len(next[k]) < lockLen) delete locks.current[k]
        if (locks.current[k] !== undefined && len(next[k]) > (locks.current[k] as number)) {
          // 이전 값이 조합 중 글자를 포함해 넘쳐 있을 수 있으므로 들어가는 값으로 되돌린다
          next = { ...next, [k]: fits(k, data) ? data[k] : clampToFit(k, next).value }
          flashLimit(k)
          continue
        }
        if (fits(k, next)) continue
        const typed = !composed && len(next[k]) - len(data[k]) <= 2 && fits(k, data)
        const value = typed ? data[k] : clampToFit(k, next).value
        next = { ...next, [k]: value }
        locks.current[k] = len(value)
        flashLimit(k)
      }
    }
    setData(next)
  }

  // 미리보기는 항상 명함 영역에 들어가는 값만 그린다 (한글 조합 중 잠깐 넘치는 글자 포함)
  const previewData = useMemo(() => {
    if (!fonts.ready) return data
    let d = data
    for (const k of ['nameEn', 'nameKo', 'affiliation', 'title', 'emailId', 'phone'] as const) {
      const { value, clipped } = clampToFit(k, d)
      if (clipped) d = { ...d, [k]: value }
    }
    return d
  }, [data, fonts.ready])

  const go = (s: Step, toSub?: number) => {
    if (toSub !== undefined) setSub(toSub)
    setStep(s)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header step={step} />
      {/* 단계 카드는 화면 세로 가운데 */}
      <div className="flex flex-1 flex-col justify-center pb-10 lg:pb-16">
        {/* 모든 단계가 같은 틀: 왼쪽 카드(입력·확인·완료) + 오른쪽 카드(명함) — 크기·위치가 바뀌지 않는다 */}
        <main className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)] gap-4 px-4 pt-2 sm:px-6 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 lg:pt-0">
          <div className={intro ? 'order-1' : 'order-2 lg:order-1'}>
            {intro && <IntroCover />}
            {step === 1 && !intro && (
              <InformationForm
                key={formKey}
                sub={sub}
                onSub={setSub}
                data={data}
                errors={errors}
                overflow={overflow}
                limitHit={limitHit}
                onChange={change}
                onLimit={flashLimit}
                org={org}
                onOrg={setOrg}
                onDone={() => go(2)}
                onBackToIntro={() => setReason(null)}
              />
            )}
            {step === 2 && (
              <Confirmation
                className={STEP_CARD_HEIGHT}
                ok={Object.keys(errors).length === 0 && !hasOverflow}
                onBack={() => go(1)}
                onConfirm={() => go(3)}
              />
            )}
            {step === 3 && (
              <Completion
                data={data}
                className={STEP_CARD_HEIGHT}
                onEdit={() => go(1, 0)}
                onRestart={() => {
                  locks.current = {}
                  setOrg(EMPTY_ORG)
                  setData(EMPTY_DATA)
                  setFormKey((k) => k + 1)
                  setReason(null)
                  go(1, 0)
                }}
              />
            )}
          </div>
          <div className={intro ? 'order-2' : 'order-1 lg:order-2'}>
            {intro ? (
              <ReasonCard
                badge="1 of 5"
                onSelect={(r) => {
                  setReason(r)
                  setSub(0)
                }}
              />
            ) : (
              <BusinessCardPreview
                data={step === 1 ? previewData : data}
                ghost={step === 1 ? SAMPLE_DATA : undefined}
                faces={step === 3 ? ['back', 'front'] : ['front']}
                onOverflow={step === 1 ? onOverflow : undefined}
              badge={step === 1 ? `${sub + 2} of 5` : step === 2 ? '5 of 5' : undefined}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
