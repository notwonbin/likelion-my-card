import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { affiliationOf, getUnit, parentOf, searchOrg, type OrgUnit } from '../data/org'

export interface OrgSelection {
  /** 조직도에서 고른 조직 */
  unitId: string | null
  /** 상위 조직도 함께 표기 */
  includeParent: boolean
  /** 목록에 없어 직접 입력 중 */
  custom: boolean
}

export const EMPTY_ORG: OrgSelection = { unitId: null, includeParent: false, custom: false }

interface Props {
  value: OrgSelection
  error?: string
  onSelect: (sel: OrgSelection, affiliation: string) => void
  onCustom: () => void
}

/** 소속 선택: 조직 검색 → 선택 → (상위 조직 표기 여부) */
export function OrgPicker({ value, error, onSelect, onCustom }: Props) {
  const unit = getUnit(value.unitId)
  const [editing, setEditing] = useState(!unit)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const results = useMemo(() => searchOrg(q), [q])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (u: OrgUnit) => {
    const sel = { unitId: u.id, includeParent: value.includeParent, custom: false }
    onSelect(sel, affiliationOf(u, sel.includeParent))
    setEditing(false)
    setQ('')
  }

  if (unit && !editing) {
    const parent = parentOf(unit)
    return (
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">소속</p>
        <button
          type="button"
          aria-label={`소속 ${unit.name} — 눌러서 다시 고르기`}
          onClick={() => {
            setEditing(true)
            setOpen(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-left transition-colors hover:border-ink/30"
        >
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-semibold">{unit.name}</span>
          </span>
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-faint">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {parent && parent.kind !== 'company' && (
          <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 text-[13.5px]">
            <input
              type="checkbox"
              className="h-[18px] w-[18px] accent-brand"
              checked={value.includeParent}
              onChange={(e) => {
                const sel = { ...value, includeParent: e.target.checked }
                onSelect(sel, affiliationOf(unit, sel.includeParent))
              }}
            />
            <span className="text-mute">{parent.name} 함께 표기</span>
          </label>
        )}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-mute">
        소속
      </label>
      {/* 검색 목록은 입력칸 아래에 떠서 보이므로 카드 레이아웃을 밀지 않는다 */}
      <div className="relative">
        <div
          className={`flex h-[52px] items-center gap-2 rounded-xl border bg-white px-4 transition-[border-color,box-shadow] ${
            error ? 'border-danger' : 'border-line focus-within:border-brand focus-within:shadow-[0_0_0_1px_var(--color-brand)]'
          }`}
        >
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-faint">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
            aria-invalid={!!error || undefined}
            value={q}
            size={1}
            placeholder="팀 이름 검색"
            autoComplete="off"
            onClick={() => setOpen(true)}
            onBlur={() => {
              setOpen(false)
              if (unit) setEditing(false)
            }}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setOpen(true)
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[active]) choose(results[active])
              } else if (e.key === 'Escape') {
                setOpen(false)
                if (unit) setEditing(false)
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:font-normal placeholder:text-faint"
          />
        </div>

        {open && (
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label="조직 목록"
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[264px] overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,.18)]"
          >
            {results.map((u, i) => (
              <li
                key={u.id}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(u)}
                className={`flex cursor-pointer items-center px-4 py-2.5 ${i === active ? 'bg-fill' : ''}`}
              >
                <span className="truncate text-[14.5px] font-semibold">{u.name}</span>
              </li>
            ))}
            {results.length === 0 && <li className="px-4 py-3 text-[13.5px] text-mute">‘{q}’에 맞는 조직이 없어요.</li>}
            <li className="border-t border-line">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onCustom}
                className="w-full px-4 py-2.5 text-left text-[13.5px] font-medium text-mute hover:bg-fill hover:text-ink"
              >
                목록에 없어요 · 직접 입력
              </button>
            </li>
          </ul>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
