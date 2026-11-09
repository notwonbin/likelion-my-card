import { useEffect, useId, useRef, useState } from 'react'
import { EMAIL_DOMAIN } from '../card/spec'
import { PHONE_PREFIX, normalizeAffiliation } from '../card/format'
import { TITLES } from '../data/org'
import { OrgPicker, type OrgSelection } from './OrgPicker'
import { AFFILIATION_MAX_LINES, wrapAffiliation } from '../card/typeset'
import type { Errors } from '../card/validation'
import type { CardData, FieldKey } from '../card/types'
import { Button, STEP_CARD_HEIGHT, StepCard, TextField } from './ui'

export const SUB_STEPS: { title: string; description: string; fields: FieldKey[] }[] = [
  { title: '이름을 알려주세요', description: '', fields: ['nameEn', 'nameKo'] },
  { title: '소속과 직책을 알려주세요', description: '', fields: ['affiliation', 'title'] },
  { title: '연락처를 입력해주세요', description: '', fields: ['emailId', 'phone'] },
]

interface Props {
  sub: number
  onSub: (n: number) => void
  data: CardData
  errors: Errors
  overflow: Partial<Record<FieldKey, boolean>>
  /** 명함 영역 초과로 입력이 막힌 항목 (표시 시각) */
  limitHit: Partial<Record<FieldKey, number>>
  onChange: (patch: Partial<CardData>, composing?: boolean, composed?: boolean) => void
  /** 한도 안내만 띄운다 (값은 그대로) */
  onLimit: (k: FieldKey) => void
  onDone: () => void
  /** 첫 질문에서 '이전' → 시작 화면 */
  onBackToIntro: () => void
  org: OrgSelection
  onOrg: (sel: OrgSelection) => void
}

const OVERFLOW_MSG = '명함 영역을 넘어요. 줄여서 입력해주세요.'
const LIMIT_MSG = '명함에 들어갈 수 있는 길이를 넘어 더 입력할 수 없어요.'

export function InformationForm({ sub, onSub, data, errors, overflow, limitHit, onChange, onLimit, onDone, onBackToIntro, org, onOrg }: Props) {
  const step = SUB_STEPS[sub]
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [tried, setTried] = useState<Record<number, boolean>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const invalid = step.fields.some((k) => errors[k] || overflow[k])
  const err = (k: FieldKey) => (tried[sub] || touched[k] ? errors[k] : undefined)
  const warn = (k: FieldKey) => (limitHit[k] ? LIMIT_MSG : overflow[k] ? OVERFLOW_MSG : undefined)

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true })
  }, [sub])

  /** 입력 연결. map: 입력값 → 저장값 변환. 한글 조합 중에는 길이 제한을 미루고 조합이 끝나면 적용한다. */
  const bind = (k: FieldKey, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>, map: (v: string) => string = (v) => v) => ({
    value: data[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [k]: map(e.target.value) }, (e.nativeEvent as InputEvent).isComposing === true),
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => onChange({ [k]: map(e.currentTarget.value) }, false, true),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched((t) => ({ ...t, [k]: true }))
      onChange({ [k]: map(e.currentTarget.value) }, false, true) // 안전장치: 포커스를 잃을 때 한 번 더 영역 확인
    },
    autoComplete: 'off',
    maxLength: 60,
    ...extra,
  })

  const next = () => {
    if (invalid) {
      setTried((t) => ({ ...t, [sub]: true }))
      formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      return
    }
    if (sub < SUB_STEPS.length - 1) onSub(sub + 1)
    else onDone()
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        next()
      }}
      className="h-full"
    >
      <StepCard
        className={STEP_CARD_HEIGHT}
        title={step.title}
        description={step.description || undefined}
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => (sub > 0 ? onSub(sub - 1) : onBackToIntro())}>
              이전
            </Button>
            <Button type="submit" className="flex-1" softDisabled={invalid}>
              {sub < SUB_STEPS.length - 1 ? '다음' : '명함 확인하기'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {sub === 0 && (
            <>
              {/* 명함 표기 순서와 같게: 영문 이름(위) → 국문 이름(아래) */}
              <TextField
                label="영문 이름"
                error={err('nameEn')}
                warning={warn('nameEn')}
                inputProps={bind('nameEn', { placeholder: 'MUTSA KIM', autoCapitalize: 'characters' })}
              />
              <TextField label="국문 이름" error={err('nameKo')} warning={warn('nameKo')} inputProps={bind('nameKo', { placeholder: '김멋사' })} />
            </>
          )}
          {sub === 1 && (
            <>
              {org.custom ? (
                <AffiliationField
                  value={data.affiliation}
                  error={err('affiliation')}
                  warning={warn('affiliation')}
                  onChange={(v, composing, composed) => onChange({ affiliation: normalizeAffiliation(v) }, composing, composed)}
                  onBlur={(v) => {
                    setTouched((t) => ({ ...t, affiliation: true }))
                    onChange({ affiliation: normalizeAffiliation(v) }, false, true)
                  }}
                  onLimit={() => onLimit('affiliation')}
                  onBackToList={() => {
                    onOrg({ ...org, custom: false })
                    onChange({ affiliation: '' })
                  }}
                />
              ) : (
                <OrgPicker
                  value={org}
                  error={err('affiliation')}
                  onSelect={(sel, affiliation) => {
                    onOrg(sel)
                    onChange({ affiliation })
                  }}
                  onCustom={() => {
                    onOrg({ unitId: null, includeParent: org.includeParent, custom: true })
                    onChange({ affiliation: '' })
                  }}
                />
              )}
              <TitlePicker
                value={data.title}
                error={err('title')}
                warning={warn('title')}
                onChange={(v, composing, composed) => onChange({ title: v }, composing, composed)}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              />
            </>
          )}
          {sub === 2 && (
            <>
              <TextField
                label="이메일"
                suffix={`@${EMAIL_DOMAIN}`}
                error={err('emailId')}
                warning={warn('emailId')}
                inputProps={bind(
                  'emailId',
                  { placeholder: 'mutsa', inputMode: 'email', autoCapitalize: 'off', spellCheck: false },
                  (v) => v.replace(/@.*$/, '').replace(/\s/g, '').toLowerCase(),
                )}
              />
              <TextField
                label="휴대전화"
                prefix={`${PHONE_PREFIX}.`}
                error={err('phone')}
                warning={warn('phone')}
                inputProps={bind(
                  'phone',
                  {
                    value: formatPhoneTail(data.phone),
                    placeholder: '1234.5678',
                    inputMode: 'numeric',
                    maxLength: 9,
                  },
                  (v) => PHONE_PREFIX + v.replace(/\D/g, '').slice(0, 8),
                )}
              />
            </>
          )}
        </div>
      </StepCard>
    </form>
  )
}

/**
 * 소속 입력 — 명함 폭을 넘으면 자동 줄바꿈(최대 2줄). Enter로 원하는 위치에서 직접 나눌 수도 있다.
 * 아래에 명함에 실제로 들어가는 줄을 그대로 보여준다.
 */
function AffiliationField({
  value,
  error,
  warning,
  onChange,
  onBlur,
  onLimit,
  onBackToList,
}: {
  value: string
  error?: string
  warning?: string
  onChange: (v: string, composing: boolean, composed: boolean) => void
  onBlur: (v: string) => void
  onLimit: () => void
  onBackToList: () => void
}) {
  const id = useId()
  const lines = value.trim() ? wrapAffiliation(value) : []
  const msgId = `${id}-msg`
  const border = error
    ? 'border-danger focus-within:shadow-[0_0_0_1px_var(--color-danger)]'
    : 'border-line focus-within:border-brand focus-within:shadow-[0_0_0_1px_var(--color-brand)]'
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-mute">
          소속
        </label>
        <button type="button" onClick={onBackToList} className="text-[12.5px] font-medium text-mute hover:text-ink">
          목록에서 고르기
        </button>
      </div>
      <div className={`overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] ${border}`}>
        <textarea
          id={id}
          rows={2}
          value={value}
          maxLength={80}
          placeholder="소속 입력 · 길면 자동으로 줄바꿈"
          aria-invalid={!!error || undefined}
          aria-describedby={msgId}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value, (e.nativeEvent as InputEvent).isComposing === true, false)}
          onCompositionEnd={(e) => onChange(e.currentTarget.value, false, true)}
          onBlur={(e) => onBlur(e.currentTarget.value)}
          onKeyDown={(e) => {
            // 이미 2줄이면 Enter로 줄을 더 늘리지 않는다
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && (value.includes('\n') || lines.length >= AFFILIATION_MAX_LINES)) {
              e.preventDefault()
              onLimit()
            }
          }}
          className="block h-[76px] w-full resize-none bg-transparent px-4 py-3 text-[16px] font-medium leading-[1.55] outline-none placeholder:font-normal placeholder:text-faint"
        />
      </div>
      {(error || warning) && (
        <p id={msgId} className={`mt-2 text-[12.5px] leading-snug ${error ? 'text-danger' : 'text-[#c05a00]'}`} role={error ? 'alert' : undefined}>
          {error ?? warning}
        </p>
      )}
    </div>
  )
}

/** 010 뒤 8자리 표시: 1234.5678 */
function formatPhoneTail(phone: string) {
  const d = phone.replace(/\D/g, '').slice(PHONE_PREFIX.length)
  return d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4, 8)}` : d
}

/** 직책 선택 — 조직도 직함 칩 + 직접 입력 */
function TitlePicker({
  value,
  error,
  warning,
  onChange,
  onBlur,
}: {
  value: string
  error?: string
  warning?: string
  onChange: (v: string, composing: boolean, composed: boolean) => void
  onBlur: () => void
}) {
  const preset = TITLES.some((t) => t.value === value)
  const [custom, setCustom] = useState(!!value && !preset)
  const inputRef = useRef<HTMLInputElement>(null)
  const chip = (on: boolean) =>
    `h-11 whitespace-nowrap rounded-lg border px-1 text-center text-[12.5px] font-bold tracking-[-0.01em] transition-colors ${
      on ? 'border-brand bg-brand-soft/70 shadow-[0_0_0_1px_var(--color-brand)]' : 'border-line bg-white hover:border-ink/30'
    }`

  // 직접 입력: 소속과 같은 방식 — 목록 자리에 입력칸, '목록에서 고르기'로 복귀
  if (custom) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-mute">직책</span>
          <button
            type="button"
            onClick={() => {
              setCustom(false)
              onChange('', false, false)
            }}
            className="text-[12.5px] font-medium text-mute hover:text-ink"
          >
            목록에서 고르기
          </button>
        </div>
        <TextField
          label="직책"
          hideLabel
          error={error}
          warning={warning}
          inputProps={{
            ref: inputRef,
            value,
            placeholder: '직책 입력',
            autoComplete: 'off',
            maxLength: 40,
            onChange: (e) => onChange(e.target.value, (e.nativeEvent as InputEvent).isComposing === true, false),
            onCompositionEnd: (e) => onChange(e.currentTarget.value, false, true),
            onBlur: (e) => {
              onBlur()
              onChange(e.currentTarget.value, false, true)
            },
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span id="title-label" className="text-[13px] font-medium text-mute">
          직책
        </span>
        <button
          type="button"
          onClick={() => {
            setCustom(true)
            onChange('', false, false)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="text-[12.5px] font-medium text-mute hover:text-ink"
        >
          직접 입력
        </button>
      </div>
      <div role="radiogroup" aria-labelledby="title-label" className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {TITLES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={value === t.value}
            onClick={() => {
              onChange(t.value, false, false)
              onBlur()
            }}
            className={chip(value === t.value)}
          >
            {t.value}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
