import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

/** 모든 단계의 왼쪽 카드 높이 (데스크톱) — 오른쪽 명함 카드도 같은 높이로 맞춰진다 */
export const STEP_CARD_HEIGHT = 'lg:h-[530px]'

/** 단계 카드: 상단 서비스명 + 진행 알약, 큰 질문 제목, 본문, 하단 고정 버튼 영역 */
export function StepCard({
  badge,
  title,
  description,
  aside,
  children,
  footer,
  className = '',
  showLabel = true,
}: {
  /** 진행 표시 (예: 1 of 3) — 없으면 표시하지 않는다 */
  badge?: string
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  /** 상단 '멋쟁이사자처럼 명함 만들기' 표시 (같은 화면에 이미 브랜드가 있으면 끔) */
  showLabel?: boolean
}) {
  return (
    <section className={`flex flex-col rounded-[20px] bg-white p-6 sm:p-8 ${className}`}>
      <div className="flex min-h-[26px] items-center justify-between gap-2">
        {showLabel ? <span className="text-[13px] font-semibold text-mute">멋쟁이사자처럼 명함 만들기</span> : <span />}
        <div className="flex items-center gap-2">
          {aside}
          {badge && <span className="rounded-full bg-fill px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-ink/70">{badge}</span>}
        </div>
      </div>
      <h1 className="mt-5 text-[24px] font-bold leading-[1.35] tracking-[-0.025em] sm:text-[26px]">{title}</h1>
      {description && <p className="mt-2 text-[14px] leading-relaxed text-mute">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
      {footer && <div className="mt-auto pt-6">{footer}</div>}
    </section>
  )
}

type Variant = 'primary' | 'secondary' | 'outline'

export function Button({
  variant = 'primary',
  softDisabled,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; softDisabled?: boolean }) {
  const base =
    'inline-flex h-[52px] items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed'
  const look = {
    primary: softDisabled
      ? 'bg-ink/20 text-white'
      : 'bg-ink text-white hover:bg-black disabled:bg-ink/20',
    secondary: 'bg-fill text-ink/70 hover:bg-[#e8e8eb] hover:text-ink',
    outline: 'border border-line bg-white text-ink hover:border-ink',
  }[variant]
  return <button aria-disabled={softDisabled || undefined} className={`${base} ${look} ${className}`} {...props} />
}

export function TextField({
  label,
  optional,
  hint,
  error,
  warning,
  suffix,
  prefix,
  hideLabel,
  inputProps,
}: {
  label: string
  optional?: boolean
  hint?: string
  error?: string
  warning?: string
  suffix?: string
  /** 입력칸 앞에 고정 표시 (예: 010.) */
  prefix?: string
  /** 라벨을 화면에서 숨김 (스크린리더용으로는 유지) */
  hideLabel?: boolean
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }
}) {
  const id = useId()
  const msg = error ?? warning ?? hint
  const tone = error ? 'text-danger' : warning ? 'text-[#c05a00]' : 'text-faint'
  const border = error
    ? 'border-danger focus-within:shadow-[0_0_0_1px_var(--color-danger)]'
    : 'border-line focus-within:border-brand focus-within:shadow-[0_0_0_1px_var(--color-brand)]'
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-2 flex items-center gap-1.5 text-[13px] font-medium text-mute'}>
        {label}
        {optional && <span className="text-faint">(선택)</span>}
      </label>
      <div
        className={`flex h-[52px] items-stretch overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] ${border}`}
      >
        {prefix && <span className="flex items-center pl-4 text-[16px] font-medium text-ink">{prefix}</span>}
        <input
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={msg ? `${id}-msg` : undefined}
          size={1}
          {...inputProps}
          className={`min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:font-normal placeholder:text-faint ${prefix ? 'pl-0.5 pr-4' : 'px-4'}`}
        />
        {suffix && <span className="flex items-center pr-4 text-[15px] text-mute">{suffix}</span>}
      </div>
      {msg && (
        <p id={`${id}-msg`} className={`mt-2 text-[12.5px] leading-snug ${tone}`} role={error ? 'alert' : undefined}>
          {msg}
        </p>
      )}
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  size = 'md',
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-fill p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[9px] font-semibold transition-colors ${size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2 text-[14px]'} ${
            value === o.value ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-mute hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
