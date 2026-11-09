import { useId, useLayoutEffect, useRef, useState } from 'react'
import frontBase from '../assets/card/front-base.svg'
import backPrint from '../assets/card/back-print.webp'
import backSilk from '../assets/card/back-silk.svg'
import { ADDRESS, ARTBOARD, COLORS, FRONT_LAYOUT as L, TYPE } from './spec'
import { AT_ADVANCE, AT_GLYPH, emailDomainRuns, emailIdRuns, hangulFamily, splitRuns, toCardText, type Run, type TypeStyle } from './typeset'
import { isEmptyField } from './format'
import type { CardData, CardSide, FinishView } from './types'

export type OverflowMap = Partial<Record<'nameEn' | 'nameKo' | 'right0' | 'right1' | 'right2' | 'email' | 'phone', boolean>>

interface Props {
  side: CardSide
  data: CardData
  finish?: FinishView
  /** 도련·재단선·안전 영역 표시 */
  guides?: boolean
  className?: string
  onOverflow?: (o: OverflowMap) => void
  /** 비어 있는 항목은 이 예시로 흐리게 보여준다 */
  ghost?: CardData
  title?: string
}

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <tspan key={i} fontFamily={r.family} fontWeight={r.weight} style={{ letterSpacing: r.spacing }}>
          {r.text}
        </tspan>
      ))}
    </>
  )
}

const styled = (text: string, style: TypeStyle) => <Runs runs={splitRuns(text, style)} />

const GHOST_OPACITY = 0.32
const FIELDS = ['nameEn', 'nameKo', 'affiliation', 'title', 'emailId', 'phone'] as const

export function CardFace({ side, data, finish = 'print', guides = false, className, onOverflow, title, ghost }: Props) {
  // 빈 항목은 예시로 채우고 흐리게 표시
  const isGhost = Object.fromEntries(FIELDS.map((k) => [k, !!ghost && isEmptyField(k, data)])) as Record<(typeof FIELDS)[number], boolean>
  const shown = ghost ? (Object.fromEntries(FIELDS.map((k) => [k, isGhost[k] ? ghost[k] : data[k]])) as unknown as CardData) : data
  const t = toCardText(shown)
  const op = (k: (typeof FIELDS)[number]) => (isGhost[k] ? GHOST_OPACITY : undefined)
  const refs = useRef<Record<string, SVGGraphicsElement | null>>({})
  const uid = useId().replace(/:/g, '')

  const { trim } = ARTBOARD
  const viewBox = guides ? `0 0 ${ARTBOARD.width} ${ARTBOARD.height}` : `${trim.x} ${trim.y} ${trim.width} ${trim.height}`

  // 레이아웃: 소속/직책 행 수에 따라 연락처 위치가 내려간다 (원본 아트보드 2~7과 동일 규칙)
  const lineCount = t.rightLines.length
  const lastBaseline = L.right.firstBaseline + L.right.leading * (lineCount - 1)
  const emailBaseline = lastBaseline + L.right.contactGap
  const phoneBaseline = emailBaseline + L.right.phoneGap

  // 영역 초과 측정
  useLayoutEffect(() => {
    if (!onOverflow || side !== 'front') return
    const measure = () => {
      const o: OverflowMap = {}
      const w = (k: string) => refs.current[k]?.getBBox().width ?? 0
      o.nameEn = w('nameEn') > L.leftMaxWidth
      o.nameKo = w('nameKo') > L.leftMaxWidth
      ;[0, 1, 2].slice(0, t.rightLines.length).forEach((i) => (o[`right${i}` as 'right0'] = w(`right${i}`) > L.rightMaxWidth))
      o.email = w('email') + (L.right.emailX - L.right.x) > L.rightMaxWidth
      o.phone = w('phone') > L.rightMaxWidth
      onOverflow(o)
    }
    measure()
    let alive = true
    document.fonts?.ready.then(() => alive && measure())
    return () => {
      alive = false
    }
  })

  const anyOverflowLine = side === 'front' && guides

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={title ?? (side === 'front' ? '명함 앞면' : '명함 뒷면')}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      data-artboard={side}
    >
      {side === 'front' ? (
        <>
          {/* 고정 요소: orange_021c 배경 + k 레이어 로고·국문 워드마크 (원본 벡터) + 회사 주소 */}
          <g data-layer-group="fixed" opacity={finish === 'plate' ? 0.12 : 1}>
            <image href={frontBase} x={0} y={0} width={ARTBOARD.width} height={ARTBOARD.height} preserveAspectRatio="none" />
            <AddressLine />
          </g>
          {/* 가변 요소: k 레이어 개인정보 텍스트 */}
          {/* 칼럼별 표시 영역: 어떤 입력이 와도 좌우 칼럼이 겹치거나 안전영역 밖으로 나가지 않는다 */}
          <defs>
            <clipPath id={`${uid}-left`}>
              <rect x={L.left.x - 1} y={ARTBOARD.trim.y} width={L.leftMaxWidth + 1} height={ARTBOARD.trim.height} />
            </clipPath>
            <clipPath id={`${uid}-right`}>
              <rect x={L.right.x - 1} y={ARTBOARD.trim.y} width={L.rightMaxWidth + 1} height={ARTBOARD.trim.height} />
            </clipPath>
          </defs>
          <g data-layer="k" data-layer-group="variable" fill={COLORS.textK98.screen} opacity={finish === 'plate' ? 0.12 : 1}>
            <g clipPath={`url(#${uid}-left)`}>
              <text ref={(el) => void (refs.current.nameEn = el)} opacity={op('nameEn')} x={L.left.x} y={L.left.nameEnBaseline} fontSize={TYPE.nameEn.size}>
                {styled(t.nameEn, TYPE.nameEn)}
              </text>
              <text ref={(el) => void (refs.current.nameKo = el)} opacity={op('nameKo')} x={L.left.x} y={L.left.nameKoBaseline} fontSize={TYPE.nameKo.size}>
                {styled(t.nameKo, TYPE.nameKo)}
              </text>
            </g>
            <g clipPath={`url(#${uid}-right)`}>
              {t.rightLines.map((line, i) => (
                <text
                  key={i}
                  ref={(el) => void (refs.current[`right${i}`] = el)}
                  opacity={op(i === t.rightLines.length - 1 ? 'title' : 'affiliation')}
                  x={L.right.x}
                  y={L.right.firstBaseline + L.right.leading * i}
                  fontSize={TYPE.affiliation.size}
                >
                  {styled(line, i === t.rightLines.length - 1 ? TYPE.title : TYPE.affiliation)}
                </text>
              ))}
              <EmailLine
                gref={(el) => void (refs.current.email = el)}
                id={t.emailId}
                x={L.right.emailX}
                y={emailBaseline}
                opacity={op('emailId')}
              />
              <text ref={(el) => void (refs.current.phone = el)} opacity={op('phone')} x={L.right.x} y={phoneBaseline} fontSize={TYPE.phone.size}>
                {styled(t.phone, TYPE.phone)}
              </text>
            </g>
          </g>
          {finish === 'plate' && <PlateNotice />}
        </>
      ) : (
        <>
          {/* 고정 요소: yellow_127c + orange_021c + k + orange_021c (인쇄 레이어 합성, 원본 600dpi 렌더) */}
          <g data-layer-group="print" opacity={finish === 'plate' ? 0.12 : 1}>
            <image href={backPrint} x={0} y={0} width={ARTBOARD.width} height={ARTBOARD.height} preserveAspectRatio="none" />
          </g>
          {/* 후가공: 실크 레이어 (인쇄 그래픽과 분리) */}
          {finish !== 'print' && (
            <g data-layer="실크" data-layer-group="finish" opacity={finish === 'overlay' ? 0.82 : 1}>
              <image href={backSilk} x={0} y={0} width={ARTBOARD.width} height={ARTBOARD.height} preserveAspectRatio="none" />
            </g>
          )}
        </>
      )}

      {guides && <Guides showSafeRight={anyOverflowLine} />}
    </svg>
  )
}

/** 텍스트 폭을 재고, 서체가 늦게 로드되거나 바뀌면 다시 잰다 */
function useFontAwareWidth(ref: React.RefObject<SVGTextElement | null>, set: (w: number) => void, key: string) {
  useLayoutEffect(() => {
    const measure = () => set(ref.current && key ? ref.current.getComputedTextLength() : 0)
    measure()
    let alive = true
    const onFonts = () => alive && measure()
    document.fonts?.ready.then(onFonts)
    document.fonts?.addEventListener('loadingdone', onFonts)
    return () => {
      alive = false
      document.fonts?.removeEventListener('loadingdone', onFonts)
    }
  }, [ref, set, key])
}

/** 이메일 줄: 아이디(Gotham) + '@'(원본 글리프 외곽선) + 도메인(Gotham) */
function EmailLine({ id, x, y, opacity, gref }: { id: string; x: number; y: number; opacity?: number; gref: (el: SVGGElement | null) => void }) {
  const idRef = useRef<SVGTextElement>(null)
  const [w, setW] = useState(0)
  useFontAwareWidth(idRef, setW, id)
  const size = TYPE.email.size
  const k = size / AT_GLYPH.unitsPerEm
  const atX = x + w
  return (
    <g ref={gref} opacity={opacity}>
      <text ref={idRef} x={x} y={y} fontSize={size}>
        <Runs runs={emailIdRuns(id)} />
      </text>
      <path d={AT_GLYPH.d} transform={`translate(${atX} ${y}) scale(${k} ${-k})`} />
      <text x={atX + AT_ADVANCE} y={y} fontSize={size}>
        <Runs runs={emailDomainRuns()} />
      </text>
    </g>
  )
}

/** 회사 주소: SUITE Heavy 7.5pt + 원본과 같은 마름모 구분 기호 */
function AddressLine() {
  const ref = useRef<SVGTextElement>(null)
  const [w, setW] = useState(0)
  const { parts, x, baseline, size, tracking, separator: sep } = ADDRESS
  useFontAwareWidth(ref, setW, parts[0])
  const dLeft = x + w + sep.gapBefore
  const cx = dLeft + sep.halfDiagonal
  const x2 = dLeft + sep.halfDiagonal * 2 + sep.gapAfter
  const h = sep.halfDiagonal
  const textProps = {
    y: baseline,
    fontSize: size,
    fontFamily: hangulFamily,
    fontWeight: 800,
    style: { letterSpacing: tracking * size },
  }
  return (
    <g data-layer="k" data-role="address" fill={COLORS.textK98.screen}>
      <text ref={ref} x={x} {...textProps}>
        {parts[0]}
      </text>
      {w > 0 && (
        <>
          <path d={`M${cx} ${sep.centerY - h}L${cx + h} ${sep.centerY}L${cx} ${sep.centerY + h}L${cx - h} ${sep.centerY}Z`} />
          <text x={x2} {...textProps}>
            {parts[1]}
          </text>
        </>
      )}
    </g>
  )
}

function PlateNotice() {
  const { trim } = ARTBOARD
  return (
    <text
      x={trim.x + trim.width / 2}
      y={trim.y + trim.height / 2}
      textAnchor="middle"
      fontSize={6}
      fill="#6b6b6b"
      fontFamily='"LL Pretendard", sans-serif'
    >
      앞면에는 후가공 레이어가 없습니다
    </text>
  )
}

function Guides({ showSafeRight }: { showSafeRight: boolean }) {
  const { trim, width, height, safe } = ARTBOARD
  const s = 0.35
  return (
    <g data-layer-group="guides" pointerEvents="none">
      {/* 도련 영역 음영 */}
      <path
        d={`M0 0H${width}V${height}H0Z M${trim.x} ${trim.y}V${trim.y + trim.height}H${trim.x + trim.width}V${trim.y}Z`}
        fill="#ffffff"
        fillOpacity={0.55}
        fillRule="evenodd"
      />
      {/* 재단선 */}
      <rect x={trim.x} y={trim.y} width={trim.width} height={trim.height} fill="none" stroke="#0a84ff" strokeWidth={s} />
      {/* 안전 영역 (재단선 안쪽 5mm) */}
      <rect
        x={safe.left}
        y={trim.y + (safe.left - trim.x)}
        width={safe.right - safe.left}
        height={trim.height - 2 * (safe.left - trim.x)}
        fill="none"
        stroke="#0a84ff"
        strokeWidth={s}
        strokeDasharray="1.6 1.2"
        opacity={showSafeRight ? 0.9 : 0.6}
      />
    </g>
  )
}
