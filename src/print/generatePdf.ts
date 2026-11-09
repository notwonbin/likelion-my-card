/**
 * 인쇄용 PDF 생성 (브라우저에서 실행)
 *
 * 결과: 3쪽 PDF, 각 쪽 96×56mm(도련 3mm 포함), TrimBox/BleedBox는 원본 그대로.
 *   1쪽 정보 면  — 원본 앞면 템플릿(로고·배경, 레이어 유지) + 개인 정보·주소를 원본 'k' 레이어 안에 K98로 기록
 *   2쪽 그래픽 면 — 원본 뒷면 인쇄 판 (실크 레이어 제외)
 *   3쪽 실크 판   — 원본 '실크' 레이어만 (원본 표시색 M100 그대로, 인쇄소에서 후가공 판으로 사용)
 *
 * 색: 원본 정의(CMYK 프로세스 + 레이어별 판 구분)를 바꾸지 않는다. 별색(팬톤) 지정은 인쇄소 확인 후 추가.
 * 서체: 영문 Gotham Bold 파일(public/fonts/Gotham-Bold.otf)이 있으면 그대로 넣고, 없으면 대체 서체로 만든 뒤
 *     '검수용'으로 표시한다(파일명·문서 정보). 대체 서체 PDF는 인쇄에 쓰지 않는다.
 */
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFOperator, PDFRef, PDFString, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import frontUrl from '../../print-templates/front-base.pdf?url'
import backUrl from '../../print-templates/back.pdf?url'
import silkUrl from '../../print-templates/back-silk.pdf?url'
import suiteUrl from '../assets/pdf-fonts/SUITE-Heavy.otf?url'
import fallbackUrl from '../assets/pdf-fonts/Montserrat-Bold-fallback.ttf?url'
import { ARTBOARD, COLORS } from '../card/spec'
import { AT_GLYPH, toCardText } from '../card/typeset'
import type { CardData } from '../card/types'
import { atContours, computeLayout, type FKFont, type FontKey } from './layout'

/** 원본 Gotham Bold를 찾는 위치 (라이선스 파일이라 저장소에 포함하지 않음) */
const GOTHAM_CANDIDATES = ['fonts/Gotham-Bold.otf', 'fonts/Gotham-Bold.ttf']

export interface PrintPdfResult {
  bytes: Uint8Array
  fileName: string
  /** 원본 Gotham으로 만들었는지 — false면 검수용 */
  printReady: boolean
}

const K98 = COLORS.textK98.cmyk.map((v) => v / 100) as [number, number, number, number]
const y = (top: number) => ARTBOARD.height - top // 화면 좌표(위→아래) → PDF 좌표(아래→위)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdf-lib 연산자 인자 타입이 좁음
const op = (name: string, ...args: any[]) => PDFOperator.of(name as any, args)
const num = (n: number) => PDFNumber.of(Math.round(n * 10000) / 10000)

async function fetchFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const b = await r.arrayBuffer()
    // 개발 서버는 없는 파일에도 index.html을 돌려줄 수 있음 → 폰트 시그니처 확인
    const sig = new Uint8Array(b.slice(0, 4))
    const s = String.fromCharCode(...sig)
    return s === 'OTTO' || s === 'true' || (sig[0] === 0 && sig[1] === 1 && sig[2] === 0 && sig[3] === 0) ? b : null
  } catch {
    return null
  }
}

export async function mustFetch(url: string) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`파일을 불러오지 못했어요: ${url}`)
  return r.arrayBuffer()
}

/** 명함 서체 (영문 Gotham 또는 대체, 한글 SUITE) — PDF·일러 스크립트 공용 */
export async function loadCardFonts() {
  let gotham: ArrayBuffer | null = null
  for (const c of GOTHAM_CANDIDATES) if (!gotham) gotham = await fetchFont(import.meta.env.BASE_URL + c)
  const bytes: Record<FontKey, ArrayBuffer> = { latin: gotham ?? (await mustFetch(fallbackUrl)), hangul: await mustFetch(suiteUrl) }
  const kit = {
    latin: fontkit.create(new Uint8Array(bytes.latin)) as unknown as FKFont,
    hangul: fontkit.create(new Uint8Array(bytes.hangul)) as unknown as FKFont,
  }
  return { bytes, kit, gotham: !!gotham }
}

/** 문자열 → TJ 배열 (서체 커닝 적용) */
function tj(doc: PDFDocument, kit: FKFont, font: PDFFont, text: string) {
  font.encodeText(text) // 글리프를 폰트 폭(W)·ToUnicode 표에 등록
  const { glyphs, positions } = kit.layout(text)
  const arr = PDFArray.withContext(doc.context)
  let hex = ''
  glyphs.forEach((g, i) => {
    hex += g.id.toString(16).padStart(4, '0')
    const kern = positions[i].xAdvance - g.advanceWidth
    if (Math.abs(kern) > 0.01 && i < glyphs.length - 1) {
      arr.push(PDFHexString.of(hex))
      arr.push(num((-kern / kit.unitsPerEm) * 1000))
      hex = ''
    }
  })
  if (hex) arr.push(PDFHexString.of(hex))
  return arr
}

/** 페이지 리소스에서 이름이 name인 OCG의 Properties 키(MC2 등) */
function ocKey(page: PDFPage, name: string): string {
  const props = page.node.Resources()?.lookup(PDFName.of('Properties'), PDFDict)
  for (const [k, v] of props?.entries() ?? []) {
    const ocg = page.doc.context.lookup(v, PDFDict)
    const n = ocg.lookup(PDFName.of('Name'))
    const s = n instanceof PDFString || n instanceof PDFHexString ? n.decodeText() : ''
    if (s === name) return k.asString().slice(1)
  }
  throw new Error(`앞면 템플릿에서 '${name}' 레이어를 찾지 못했어요`)
}

/** 복사해 온 쪽의 레이어(OCG)를 문서 레이어 목록에 등록 — 아크로뱃에서 레이어가 그대로 보이게 */
function registerLayers(doc: PDFDocument, page: PDFPage) {
  const ocp = doc.catalog.lookup(PDFName.of('OCProperties'), PDFDict)
  const ocgs = ocp.lookup(PDFName.of('OCGs'), PDFArray)
  const d = ocp.lookup(PDFName.of('D'), PDFDict)
  const on = d.lookup(PDFName.of('ON'), PDFArray)
  const order = d.lookup(PDFName.of('Order'), PDFArray)
  const props = page.node.Resources()?.lookup(PDFName.of('Properties'), PDFDict)
  const seen = new Set<string>()
  for (const [, ref] of props?.entries() ?? []) {
    if (!(ref instanceof PDFRef) || seen.has(ref.toString())) continue
    seen.add(ref.toString())
    ocgs.push(ref)
    on.push(ref)
    order.push(ref)
  }
}

export function cardFileName(data: CardData, ext: string, suffix = '') {
  const t = toCardText(data)
  const who = t.nameKo || t.nameEn || '이름없음'
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return { who, name: `명함_${who}_${ymd}${suffix}.${ext}` }
}

export async function generatePrintPdf(data: CardData): Promise<PrintPdfResult> {
  const [frontBytes, backBytes, silkBytes, fonts] = await Promise.all([mustFetch(frontUrl), mustFetch(backUrl), mustFetch(silkUrl), loadCardFonts()])
  const items = computeLayout(data, fonts.kit) // 서체에 없는 글자가 있으면 여기서 중단

  const doc = await PDFDocument.load(frontBytes, { updateMetadata: false })
  doc.registerFontkit(fontkit)
  // 서체 전체 포함: 글리프 ID가 원본과 같아야 커닝(TJ)을 그대로 기록할 수 있다
  const pdfFont: Record<FontKey, PDFFont> = {
    latin: await doc.embedFont(fonts.bytes.latin, { subset: false }),
    hangul: await doc.embedFont(fonts.bytes.hangul, { subset: false }),
  }
  const page = doc.getPage(0)
  const tag: Record<FontKey, string> = {
    latin: page.node.newFontDictionary('LLLatin', pdfFont.latin.ref).asString().slice(1),
    hangul: page.node.newFontDictionary('LLHangul', pdfFont.hangul.ref).asString().slice(1),
  }

  const ops: PDFOperator[] = [op('q'), op('BDC', PDFName.of('OC'), PDFName.of(ocKey(page, 'k'))), op('k', ...K98.map(num))]
  for (const it of items) {
    if (it.kind === 'text') {
      ops.push(op('BT'), op('Tm', num(1), num(0), num(0), num(1), num(it.x), num(y(it.top))))
      for (const r of it.runs) {
        ops.push(op('Tf', PDFName.of(tag[r.font]), num(it.size)), op('Tc', num(r.tracking)), op('TJ', tj(doc, fonts.kit[r.font], pdfFont[r.font], r.text)))
      }
      ops.push(op('ET'))
    } else if (it.kind === 'at') {
      const k = it.size / AT_GLYPH.unitsPerEm
      const P = (gx: number, gy: number) => [num(it.x + gx * k), num(y(it.top) + gy * k)]
      for (const c of atContours()) {
        c.forEach((s, i) => {
          if (i === 0) ops.push(op('m', ...P(s.x, s.y)))
          else if (s.c1 && s.c2) ops.push(op('c', ...P(...s.c1), ...P(...s.c2), ...P(s.x, s.y)))
          else ops.push(op('l', ...P(s.x, s.y)))
        })
        ops.push(op('h'))
      }
      ops.push(op('f'))
    } else {
      ops.push(
        op('m', num(it.cx), num(y(it.cy - it.h))),
        op('l', num(it.cx + it.h), num(y(it.cy))),
        op('l', num(it.cx), num(y(it.cy + it.h))),
        op('l', num(it.cx - it.h), num(y(it.cy))),
        op('h'),
        op('f'),
      )
    }
  }
  ops.push(op('EMC'), op('Q'))
  page.pushOperators(...ops)

  // 2쪽 그래픽 면, 3쪽 실크 판
  for (const bytes of [backBytes, silkBytes]) {
    const src = await PDFDocument.load(bytes, { updateMetadata: false })
    const [p] = await doc.copyPages(src, [0])
    doc.addPage(p)
    registerLayers(doc, p)
  }

  const printReady = fonts.gotham
  const { who, name } = cardFileName(data, 'pdf', printReady ? '' : '_검수용')
  doc.setTitle(`LIKELION 명함 — ${who}${printReady ? '' : ' (검수용: 대체 서체)'}`)
  doc.setSubject('1쪽 정보 면 / 2쪽 그래픽 면 / 3쪽 실크 후가공 판 · 90×50mm, 도련 3mm')
  doc.setCreator('LIKELION My Card')
  doc.setProducer('LIKELION My Card (pdf-lib)')
  const bytes = await doc.save({ useObjectStreams: false })
  return { bytes, fileName: name, printReady }
}

/** 브라우저 다운로드 */
export function downloadFile(bytes: Uint8Array | string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export const downloadPdf = (r: PrintPdfResult) => downloadFile(r.bytes, r.fileName, 'application/pdf')
