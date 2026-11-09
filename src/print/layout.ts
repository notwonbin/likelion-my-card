/**
 * 정보 면 가변 요소의 최종 배치 (인쇄용 PDF와 일러스트레이터 스크립트가 함께 사용)
 * 좌표: pt, 원점 = 도련 포함 페이지 좌상단, y는 아래로 증가 (spec.ts와 같음). top = baseline 위치.
 * 글자 폭은 실제 서체 파일(fontkit, 커닝 포함)로 계산 — 화면 SVG와 같은 방식(자간은 글자마다 더함).
 */
import { ADDRESS, FRONT_LAYOUT as L, TYPE } from '../card/spec'
import { AT_GLYPH, splitRuns, toCardText } from '../card/typeset'
import type { CardData } from '../card/types'

export type FontKey = 'latin' | 'hangul'
export interface FKGlyph { id: number; advanceWidth: number }
export interface FKFont {
  unitsPerEm: number
  hasGlyphForCodePoint(c: number): boolean
  layout(t: string): { glyphs: FKGlyph[]; positions: { xAdvance: number }[] }
}

export interface Run { text: string; font: FontKey; /** 자간(pt) */ tracking: number }
export type Item =
  | { kind: 'text'; role: string; runs: Run[]; x: number; top: number; size: number }
  | { kind: 'at'; x: number; top: number; size: number }
  | { kind: 'diamond'; cx: number; cy: number; h: number }

type Style = { size: number; latinTracking: number; hangulTracking: number }

export function runWidth(kit: FKFont, text: string, size: number, tracking: number) {
  const { glyphs, positions } = kit.layout(text)
  if (glyphs.some((g) => g.id === 0)) {
    const missing = [...new Set(text)].filter((ch) => !kit.hasGlyphForCodePoint(ch.codePointAt(0)!))
    throw new Error(`서체에 없는 글자가 있어요: ${missing.join(' ') || text}`)
  }
  return (positions.reduce((s, p) => s + p.xAdvance, 0) / kit.unitsPerEm) * size + tracking * glyphs.length
}

const toRuns = (text: string, style: Style): Run[] =>
  splitRuns(text, style as never).map((r) => ({ text: r.text, font: r.weight === 800 ? 'hangul' : 'latin', tracking: r.spacing }))

export function computeLayout(data: CardData, kit: Record<FontKey, FKFont>): Item[] {
  const t = toCardText(data)
  const items: Item[] = []
  const width = (runs: Run[], size: number) => runs.reduce((s, r) => s + runWidth(kit[r.font], r.text, size, r.tracking), 0)
  const text = (role: string, s: string, style: Style, x: number, top: number) => {
    if (!s) return 0
    const runs = toRuns(s, style)
    items.push({ kind: 'text', role, runs, x, top, size: style.size })
    return width(runs, style.size)
  }

  text('nameEn', t.nameEn, TYPE.nameEn, L.left.x, L.left.nameEnBaseline)
  text('nameKo', t.nameKo, TYPE.nameKo, L.left.x, L.left.nameKoBaseline)
  t.rightLines.forEach((line, i) => {
    const last = i === t.rightLines.length - 1
    text(last ? 'title' : `affiliation${i + 1}`, line, last ? TYPE.title : TYPE.affiliation, L.right.x, L.right.firstBaseline + L.right.leading * i)
  })
  const emailTop = L.right.firstBaseline + L.right.leading * (t.rightLines.length - 1) + L.right.contactGap

  // 이메일: 아이디 + '@'(원본 글리프 외곽선) + 도메인
  const es = TYPE.email
  const emailStyle = { ...es, hangulTracking: es.latinTracking }
  const atX = L.right.emailX + text('emailId', t.emailId, emailStyle, L.right.emailX, emailTop)
  items.push({ kind: 'at', x: atX, top: emailTop, size: es.size })
  const atAdvance = (AT_GLYPH.advance / AT_GLYPH.unitsPerEm) * es.size + es.latinTracking * es.size
  text('emailDomain', t.email.slice(t.email.indexOf('@') + 1), emailStyle, atX + atAdvance, emailTop)

  text('phone', t.phone, TYPE.phone, L.right.x, emailTop + L.right.phoneGap)

  // 주소: 숫자·영문까지 모두 SUITE Heavy (원본 아웃라인 분석 결과) + 마름모 구분 기호
  const sp = ADDRESS.tracking * ADDRESS.size
  const addr = (role: string, s: string, x: number) => {
    const runs: Run[] = [{ text: s, font: 'hangul', tracking: sp }]
    items.push({ kind: 'text', role, runs, x, top: ADDRESS.baseline, size: ADDRESS.size })
    return width(runs, ADDRESS.size)
  }
  const sep = ADDRESS.separator
  const w0 = addr('address1', ADDRESS.parts[0], ADDRESS.x)
  const cx = ADDRESS.x + w0 + sep.gapBefore + sep.halfDiagonal
  items.push({ kind: 'diamond', cx, cy: sep.centerY, h: sep.halfDiagonal })
  addr('address2', ADDRESS.parts[1], cx + sep.halfDiagonal + sep.gapAfter)
  return items
}

/** '@' 글리프 외곽선 → 하위 경로 목록 (글꼴 단위, y 위쪽). Q는 3차 곡선으로 변환. */
export interface Seg { x: number; y: number; c1?: [number, number]; c2?: [number, number] }
export function atContours(): Seg[][] {
  const tokens = AT_GLYPH.d.match(/[MLHVQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []
  const contours: Seg[][] = []
  let cur: Seg[] = []
  let i = 0, cmd = '', x = 0, y = 0
  const n = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    if (/[A-Z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase()
    if (cmd === 'M') { if (cur.length) contours.push(cur); x = n(); y = n(); cur = [{ x, y }] }
    else if (cmd === 'L') { x = n(); y = n(); cur.push({ x, y }) }
    else if (cmd === 'H') { x = n(); cur.push({ x, y }) }
    else if (cmd === 'V') { y = n(); cur.push({ x, y }) }
    else if (cmd === 'Q') {
      const qx = n(), qy = n(), ex = n(), ey = n()
      cur.push({ x: ex, y: ey, c1: [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y)], c2: [ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey)] })
      x = ex; y = ey
    } else if (cmd === 'Z') { if (cur.length) contours.push(cur); cur = [] }
    else i++
  }
  if (cur.length) contours.push(cur)
  return contours
}
