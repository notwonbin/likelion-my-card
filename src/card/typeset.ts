/**
 * 명함 텍스트 조판 규칙 — 미리보기(CardFace)와 입력 제한(fit) 이 같은 규칙을 쓴다.
 * 한 줄 안에서 한글은 SUITE Heavy, 영문·숫자·기호는 Gotham Bold, 이메일 '@'는 Pretendard Black.
 */
import { EMAIL_DOMAIN, FONTS, FRONT_LAYOUT as L, TYPE } from './spec'
import { formatPhone, fullEmail, upperLatin } from './format'
import { isHangul } from './validation'
import type { CardData, TextFieldKey } from './types'

export type TypeStyle = (typeof TYPE)[keyof typeof TYPE]

export const latinFamily = `"${FONTS.latin.family}", "${FONTS.latin.fallback}", sans-serif`
export const hangulFamily = `"${FONTS.hangul.family}", sans-serif`

export interface Run {
  text: string
  family: string
  weight: number
  /** letter-spacing (pt) */
  spacing: number
}

/** 문자열을 한글/비한글 런으로 나눈다. 공백은 앞 런에 붙인다 (원본: "교육기획 " + "3 GROUP"). */
export function splitRuns(text: string, style: TypeStyle): Run[] {
  const runs: { text: string; hangul: boolean }[] = []
  for (const ch of text) {
    const h = ch === ' ' && runs.length ? runs[runs.length - 1].hangul : isHangul(ch)
    const last = runs[runs.length - 1]
    if (last && last.hangul === h) last.text += ch
    else runs.push({ text: ch, hangul: h })
  }
  return runs.map((r) => ({
    text: r.text,
    family: r.hangul ? hangulFamily : latinFamily,
    weight: r.hangul ? 800 : 700,
    spacing: (r.hangul ? style.hangulTracking : style.latinTracking) * style.size,
  }))
}

/**
 * 이메일 '@' — 원본 .ai에 임베드된 Pretendard(Black 굵기) '@' 글리프 외곽선을 그대로 사용.
 * 서체 파일 로딩에 의존하지 않아 어떤 브라우저에서도 원본과 같은 굵기로 그려지고, PDF 출력에도 그대로 쓸 수 있다.
 * 좌표: unitsPerEm 2048, y축 위쪽(+) — 그릴 때 scale(size/2048, -size/2048).
 */
export const AT_GLYPH = {
  unitsPerEm: 2048,
  advance: 1783,
  d: 'M491 612Q491 747 534.0 834.5Q577 922 645.0 964.0Q713 1006 792 1006Q843 1006 885.0 988.5Q927 971 956.0 941.0Q985 911 1001 873H1007V978H1267V346H1003Q987 308 958.5 280.0Q930 252 887.5 235.0Q845 218 794 218Q711 218 642.0 261.5Q573 305 532.0 393.5Q491 482 491 612ZM1017 612Q1017 660 1004.0 694.5Q991 729 966.5 748.0Q942 767 908 767Q876 767 851.5 748.0Q827 729 815.5 694.5Q804 660 804 612Q804 564 815.5 529.5Q827 495 851.5 477.0Q876 459 908 459Q942 459 966.5 477.0Q991 495 1004.0 529.5Q1017 564 1017 612ZM89 612Q89 848 191.0 1034.0Q293 1220 476.0 1325.0Q659 1430 892 1430Q1125 1430 1307.5 1333.0Q1490 1236 1592.0 1061.0Q1694 886 1694 665Q1694 520 1648.0 416.5Q1602 313 1512.5 260.0Q1423 207 1298 207Q1212 208 1144.5 233.0Q1077 258 1038.5 303.0Q1000 348 1000 403L1267 524Q1267 485 1281.5 464.5Q1296 444 1325 444Q1361 444 1385.5 469.5Q1410 495 1422.5 543.0Q1435 591 1435 659Q1435 811 1370.0 924.5Q1305 1038 1182.5 1101.0Q1060 1164 892 1164Q729 1164 605.5 1096.5Q482 1029 415.0 904.0Q348 779 348 612Q348 434 409.5 310.5Q471 187 592.5 122.5Q714 58 892 58Q998 58 1093.0 70.0Q1188 82 1267 102V-156Q1187 -182 1091.5 -195.0Q996 -208 892 -208Q637 -208 456.0 -106.0Q275 -4 182.0 181.0Q89 366 89 612Z',
} as const

/** 이메일 줄 구성: 아이디 + '@'(도형) + 도메인 */
export const emailIdRuns = (id: string): Run[] => [
  { text: id, family: latinFamily, weight: 700, spacing: TYPE.email.latinTracking * TYPE.email.size },
]
export const emailDomainRuns = (): Run[] => [
  { text: EMAIL_DOMAIN, family: latinFamily, weight: 700, spacing: TYPE.email.latinTracking * TYPE.email.size },
]
/** '@' 자리 폭(pt) — 원본: '@' 시작점 → 도메인 시작점 6.716pt (글리프 폭 + 자간 -10) */
export const AT_ADVANCE = (AT_GLYPH.advance / AT_GLYPH.unitsPerEm) * TYPE.email.size + TYPE.email.latinTracking * TYPE.email.size

/* ── 측정 ─────────────────────────────────────────────────────────── */

let host: SVGSVGElement | null = null
function measureHost() {
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    host.setAttribute('aria-hidden', 'true')
    Object.assign(host.style, { position: 'absolute', width: '0', height: '0', overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' })
    document.body.appendChild(host)
  }
  return host
}

/** 런 묶음의 실제 폭(pt) — 화면 미리보기와 같은 서체·자간으로 측정 */
export function measureRuns(runs: Run[], size: number): number {
  const svg = measureHost()
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  t.setAttribute('font-size', String(size))
  for (const r of runs) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    s.setAttribute('font-family', r.family)
    s.setAttribute('font-weight', String(r.weight))
    s.style.letterSpacing = `${r.spacing}px`
    s.textContent = r.text
    t.appendChild(s)
  }
  svg.appendChild(t)
  const w = t.getComputedTextLength()
  svg.removeChild(t)
  return w
}

/* ── 소속 줄바꿈 ─────────────────────────────────────────────────── */

/** 소속 최대 줄 수 (직책 포함 우측 칼럼 최대 3줄 — 원본 아트보드 3·6·7과 동일) */
export const AFFILIATION_MAX_LINES = 2

const lineWidth = (text: string) => measureRuns(splitRuns(text, TYPE.affiliation), TYPE.affiliation.size)

/**
 * 소속을 명함 폭에 맞춰 줄로 나눈다.
 * - 사용자가 넣은 줄바꿈(\n)은 그대로 존중
 * - 각 줄은 단어(공백) 단위로 채우고, 한 단어가 한 줄보다 길면 글자 단위로 끊는다
 */
export function wrapAffiliation(raw: string, maxWidth: number = L.rightMaxWidth): string[] {
  const out: string[] = []
  for (const para of upperLatin(raw).split('\n')) {
    const words = para.trim().split(/\s+/).filter(Boolean)
    if (!words.length) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (lineWidth(candidate) <= maxWidth) {
        line = candidate
        continue
      }
      if (line) out.push(line)
      // 단어 자체가 한 줄보다 길면 글자 단위로 끊는다
      let rest = word
      while (lineWidth(rest) > maxWidth) {
        const chars = Array.from(rest)
        let n = chars.length - 1
        while (n > 1 && lineWidth(chars.slice(0, n).join('')) > maxWidth) n--
        out.push(chars.slice(0, n).join(''))
        rest = chars.slice(n).join('')
      }
      line = rest
    }
    out.push(line)
  }
  return out
}

/** 명함에 실제로 들어가는 텍스트 (표기 규칙·줄바꿈 적용 후) */
export function toCardText(d: CardData) {
  const affiliation = d.affiliation.trim() ? wrapAffiliation(d.affiliation) : ['']
  return {
    nameEn: upperLatin(d.nameEn.trim()),
    nameKo: d.nameKo.trim(),
    affiliationLines: affiliation,
    rightLines: [...affiliation, upperLatin(d.title.trim())],
    emailId: d.emailId.trim().toLowerCase(),
    email: fullEmail(d.emailId.trim().toLowerCase()),
    phone: formatPhone(d.phone),
  }
}

/* ── 항목별 허용 폭 ───────────────────────────────────────────────── */

/** 각 입력 항목이 명함에서 차지할 수 있는 최대 폭(pt) — 소속은 줄마다 */
export const MAX_WIDTH: Record<TextFieldKey, number> = {
  nameEn: L.leftMaxWidth,
  nameKo: L.leftMaxWidth,
  affiliation: L.rightMaxWidth,
  title: L.rightMaxWidth,
  emailId: L.rightMaxWidth - (L.right.emailX - L.right.x),
  phone: L.rightMaxWidth,
}

/** 입력값 하나가 명함에 들어갔을 때의 폭(pt) — 한 줄 항목용 */
export function fieldWidth(k: Exclude<TextFieldKey, 'affiliation'>, d: CardData): number {
  const v = d[k].trim()
  switch (k) {
    case 'nameEn':
      return measureRuns(splitRuns(upperLatin(v), TYPE.nameEn), TYPE.nameEn.size)
    case 'nameKo':
      return measureRuns(splitRuns(v, TYPE.nameKo), TYPE.nameKo.size)
    case 'title':
      return measureRuns(splitRuns(upperLatin(v), TYPE.title), TYPE.title.size)
    case 'emailId':
      return measureRuns(emailIdRuns(v.toLowerCase()), TYPE.email.size) + AT_ADVANCE + measureRuns(emailDomainRuns(), TYPE.email.size)
    case 'phone':
      return measureRuns(splitRuns(formatPhone(v), TYPE.phone), TYPE.phone.size)
  }
}

/** 명함 영역에 들어가는가 — 소속은 줄바꿈 후 최대 2줄 */
export const fits = (k: TextFieldKey, d: CardData) =>
  k === 'affiliation' ? wrapAffiliation(d.affiliation).length <= AFFILIATION_MAX_LINES : fieldWidth(k, d) <= MAX_WIDTH[k] + 0.01

/**
 * 명함 영역에 들어가는 만큼만 남긴다. 붙여넣기처럼 한 번에 길게 들어온 경우 뒤에서부터 잘라낸다.
 */
export function clampToFit(k: TextFieldKey, d: CardData): { value: string; clipped: boolean } {
  if (fits(k, d)) return { value: d[k], clipped: false }
  const chars = Array.from(d[k])
  let lo = 0
  let hi = chars.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (fits(k, { ...d, [k]: chars.slice(0, mid).join('') })) lo = mid
    else hi = mid - 1
  }
  return { value: chars.slice(0, lo).join('').replace(/\s+$/, ''), clipped: true }
}
