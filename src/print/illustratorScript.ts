/**
 * 일러스트레이터용 스크립트(.jsx) 생성 — 원본 .ai와 같은 레이어 구조의 새 문서를 만든다.
 *
 * 실행: Illustrator › 파일 › 스크립트 › 기타 스크립트… 에서 받은 .jsx 선택
 * 결과: 스크립트와 같은 폴더에 '명함_이름_날짜.ai'(글자 수정 가능) + '명함_이름_날짜_outline.ai'(글자 아웃라인, 인쇄소용)
 *   - 아트보드 2개: 1 정보 면, 2 그래픽 면 (재단 90×50mm, 도련 3mm)
 *   - 레이어 (위→아래): spec · 실크 · orange_021c · k · orange_021c · yellow_127c  (원본과 같음)
 *   - 그래픽: 원본 PDF에서 레이어별로 분리한 벡터를 각 레이어에 포함 (CMYK 값 그대로)
 *   - 개인 정보·주소: k 레이어에 살아 있는 텍스트 (Gotham Bold / SUITE Heavy, K98, 원본 자간)
 *     '@'는 원본 글리프 외곽선, 주소 구분 기호는 원본 마름모
 * 그래픽 데이터는 스크립트 안에 들어 있어 따로 받을 파일이 없다.
 * 위치(x, baseline)는 웹 계산값(인쇄용 PDF와 동일)을 쓰되, Gotham에 따라 달라지는
 * 이메일의 '@'·도메인 위치만은 일러스트레이터 안에서 아이디 글자 폭을 직접 재서 정한다.
 */
import frontOrange from '../../print-templates/layers/front_orange.pdf?url'
import frontK from '../../print-templates/layers/front_k.pdf?url'
import backYellow from '../../print-templates/layers/back_yellow.pdf?url'
import backOrangeLow from '../../print-templates/layers/back_orange_low.pdf?url'
import backK from '../../print-templates/layers/back_k.pdf?url'
import backOrangeTop from '../../print-templates/layers/back_orange_top.pdf?url'
import backSilk from '../../print-templates/layers/back_silk.pdf?url'
import { ARTBOARD, COLORS, FONTS } from '../card/spec'
import { AT_GLYPH } from '../card/typeset'
import type { CardData } from '../card/types'
import { cardFileName, loadCardFonts, mustFetch } from './generatePdf'
import { atContours, computeLayout } from './layout'

/** 레이어 이름 — 원본 순서(아래 → 위). 같은 이름의 orange_021c 두 개도 원본 그대로 */
const LAYERS = ['yellow_127c', 'orange_021c', 'k', 'orange_021c', '실크', 'spec'] as const
/** 레이어 번호(LAYERS 인덱스) → 아트보드별 그래픽 */
const ART: { board: 0 | 1; layer: number; url: string }[] = [
  { board: 0, layer: 1, url: frontOrange },
  { board: 0, layer: 2, url: frontK },
  { board: 1, layer: 0, url: backYellow },
  { board: 1, layer: 1, url: backOrangeLow },
  { board: 1, layer: 2, url: backK },
  { board: 1, layer: 3, url: backOrangeTop },
  { board: 1, layer: 4, url: backSilk },
]

/** 페이지를 연 직후 레이어별 그래픽을 미리 받아 두기 */
export const warmUpIllustrator = () => Promise.all(ART.map((a) => mustFetch(a.url)))

const b64 = (buf: ArrayBuffer) => {
  let s = ''
  const u = new Uint8Array(buf)
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return btoa(s)
}
/** ExtendScript가 인코딩을 잘못 읽어도 깨지지 않도록 ASCII만 사용 */
const lit = (v: unknown) => JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
const r3 = (n: number) => Math.round(n * 1000) / 1000

export async function generateIllustratorScript(data: CardData) {
  // 영문 폭은 일러스트레이터가 설치된 Gotham으로 직접 잰다 → 웹에는 Gotham이 없어도 된다
  const fonts = await loadCardFonts({ askLocal: false })
  const items = computeLayout(data, fonts.kit).map((it) =>
    it.kind === 'text'
      ? { ...it, x: r3(it.x), top: r3(it.top), runs: it.runs.map((r) => ({ ...r, tracking: Math.round((r.tracking / it.size) * 1000) })) }
      : it,
  )
  const art = await Promise.all(ART.map(async (a) => ({ board: a.board, layer: a.layer, b64: b64(await mustFetch(a.url)) })))
  const contours = atContours().map((c) => c.map((s) => [r3(s.x), r3(s.y), ...(s.c1 ? [r3(s.c1[0]), r3(s.c1[1]), r3(s.c2![0]), r3(s.c2![1])] : [])]))
  const { name } = cardFileName(data, 'ai')
  const fileName = name
  const script = TEMPLATE.replace('__CONFIG__', () =>
    lit({
      fileName,
      bleed: ARTBOARD.bleed,
      trim: { w: ARTBOARD.trim.width, h: ARTBOARD.trim.height },
      page: { w: ARTBOARD.width, h: ARTBOARD.height },
      layers: LAYERS,
      boards: ['정보 면', '그래픽 면'],
      fonts: { latin: FONTS.latin.postscript, hangul: FONTS.hangul.postscript },
      k: COLORS.textK98.cmyk,
      at: { upm: AT_GLYPH.unitsPerEm, contours, advance: AT_GLYPH.advance / AT_GLYPH.unitsPerEm },
      items,
    }),
  ).replace('__ART__', () => lit(art))
  return { script, fileName: fileName.replace(/\.ai$/, '.jsx') }
}

/* ExtendScript (ES3) — 화살표 함수·let·forEach·JSON 사용 금지 */
const TEMPLATE = `#target illustrator
// LIKELION My Card - builds the business card document (generated)
// Run: File > Scripts > Other Script... and choose this file
(function () {
  var C = __CONFIG__;
  var ART = __ART__;

  function fail(msg) { alert(msg); throw new Error(msg); }

  // 1) fonts
  var F = {};
  try { F.latin = app.textFonts.getByName(C.fonts.latin); } catch (e) {}
  try { F.hangul = app.textFonts.getByName(C.fonts.hangul); } catch (e) {}
  if (!F.latin || !F.hangul) {
    alert('\\uC11C\\uCCB4\\uAC00 \\uC124\\uCE58\\uB418\\uC5B4 \\uC788\\uC9C0 \\uC54A\\uC544\\uC694:\\n' +
      (F.latin ? '' : C.fonts.latin + '\\n') + (F.hangul ? '' : C.fonts.hangul));
    return;
  }

  // 2) unpack per-layer artwork PDFs
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function decode(s) {
    var out = [], buf = 0, bits = 0, i, v, chunk = '';
    for (i = 0; i < s.length; i++) {
      v = B64.indexOf(s.charAt(i));
      if (v < 0) continue;
      buf = (buf << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push(String.fromCharCode((buf >> bits) & 255)); }
      if (out.length > 4096) { chunk += out.join(''); out = []; }
    }
    return chunk + out.join('');
  }
  var tmp = new Folder(Folder.temp + '/likelion-mycard-' + new Date().getTime());
  tmp.create();
  var files = [], i, j;
  for (i = 0; i < ART.length; i++) {
    var f = new File(tmp + '/art' + i + '.pdf');
    f.encoding = 'BINARY';
    f.open('w'); f.write(decode(ART[i].b64)); f.close();
    files.push(f);
  }

  // 3) CMYK document, 2 artboards (trim size), 3mm bleed
  app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
  var preset = new DocumentPreset();
  preset.colorMode = DocumentColorSpace.CMYK;
  preset.units = RulerUnits.Millimeters;
  preset.width = C.trim.w; preset.height = C.trim.h;
  preset.numArtboards = 2;
  preset.artboardLayout = DocumentArtboardLayout.GridByRow;
  preset.artboardRowsOrCols = 1;
  preset.artboardSpacing = 40;
  preset.documentBleedLink = true;
  preset.documentBleedOffsetRect = [C.bleed, C.bleed, C.bleed, C.bleed];
  var doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
  var AB = [];
  for (i = 0; i < 2; i++) {
    var gap = 40 + 2 * C.bleed;
    var top = -i * (C.trim.h + gap);
    doc.artboards[i].artboardRect = [0, top, C.trim.w, top - C.trim.h];
    doc.artboards[i].name = C.boards[i];
    AB.push({ left: 0, top: top });
  }
  // page coords (origin = bleed top-left, y down) -> document coords
  function X(b, x) { return AB[b].left + (x - C.bleed); }
  function Y(b, t) { return AB[b].top - (t - C.bleed); }

  // 4) layers: same names and order as the original (added bottom-up)
  var L = [];
  doc.layers[0].name = C.layers[0];
  L.push(doc.layers[0]);
  for (i = 1; i < C.layers.length; i++) { var ly = doc.layers.add(); ly.name = C.layers[i]; L.push(ly); }

  // 5) artwork (every PDF box = full bleed page, so placement is exact)
  try { app.preferences.PDFFileOptions.pDFCropToBox = PDFBoxType.PDFMEDIABOX; } catch (e) {}
  for (i = 0; i < ART.length; i++) {
    var p = L[ART[i].layer].placedItems.add();
    p.file = files[i];
    p.position = [X(ART[i].board, 0), Y(ART[i].board, 0)];
    try { p.embed(); } catch (e) {}
  }

  // 6) personal text and shapes on layer k
  var K = L[2];
  var ink = new CMYKColor();
  ink.cyan = C.k[0]; ink.magenta = C.k[1]; ink.yellow = C.k[2]; ink.black = C.k[3];
  function paint(item) { item.filled = true; item.stroked = false; item.fillColor = ink; }

  // advance width of a text frame, measured in Illustrator: outline(text + 'H') minus outline('H')
  function advanceOf(tf) {
    var probe = tf.duplicate(); probe.contents = tf.contents + 'H';
    var last = probe.textRange.characters[probe.contents.length - 1].characterAttributes;
    last.textFont = F.latin; last.tracking = 0;
    var ref = tf.duplicate(); ref.contents = 'H';
    ref.textRange.characterAttributes.textFont = F.latin; ref.textRange.characterAttributes.tracking = 0;
    var gA = probe.createOutline(), gB = ref.createOutline();
    var w = gA.geometricBounds[2] - gB.geometricBounds[2];
    gA.remove(); gB.remove();
    return w;
  }
  var emailX = null, emailW = 0, atX = null;
  for (i = 0; i < C.items.length; i++) {
    var it = C.items[i];
    if (it.kind === 'text' && it.role === 'emailDomain' && atX !== null) it.x = atX + C.at.advance * it.size + it.runs[0].tracking / 1000 * it.size;
    if (it.kind === 'at' && emailX !== null) { it.x = emailX + emailW; atX = it.x; }
    if (it.kind === 'text') {
      var s = '';
      for (j = 0; j < it.runs.length; j++) s += it.runs[j].text;
      var tf = K.textFrames.pointText([X(0, it.x), Y(0, it.top)]);
      tf.contents = s;
      tf.name = it.role;
      var all = tf.textRange.characterAttributes;
      all.size = it.size; all.fillColor = ink;
      try { all.kerningMethod = AutoKernType.AUTO; } catch (e) {}
      var n = 0;
      for (j = 0; j < it.runs.length; j++) {
        var r = it.runs[j];
        for (var c = 0; c < r.text.length; c++, n++) {
          var ca = tf.textRange.characters[n].characterAttributes;
          ca.textFont = F[r.font];
          ca.tracking = r.tracking;
        }
      }
      if (it.role === 'emailId') { emailX = it.x; emailW = advanceOf(tf); }
    } else if (it.kind === 'at') {
      var k = it.size / C.at.upm;
      var cp = K.compoundPathItems.add();
      cp.name = '@';
      for (j = 0; j < C.at.contours.length; j++) {
        var segs = C.at.contours[j], pts = [], m;
        for (m = 0; m < segs.length; m++) {
          var g = segs[m];
          pts.push({ a: [X(0, it.x) + g[0] * k, Y(0, it.top) + g[1] * k], l: null, r: null,
            c1: g.length > 2 ? [X(0, it.x) + g[2] * k, Y(0, it.top) + g[3] * k] : null,
            c2: g.length > 2 ? [X(0, it.x) + g[4] * k, Y(0, it.top) + g[5] * k] : null });
        }
        // merge closing point
        var first = pts[0], last = pts[pts.length - 1];
        if (pts.length > 1 && Math.abs(first.a[0] - last.a[0]) < 0.001 && Math.abs(first.a[1] - last.a[1]) < 0.001) {
          first.c1 = last.c1; first.c2 = last.c2; pts.pop();
        }
        // handles: this.left = c2, prev.right = c1
        for (m = 0; m < pts.length; m++) {
          if (pts[m].c1) {
            var prev = pts[(m - 1 + pts.length) % pts.length];
            prev.r = pts[m].c1; pts[m].l = pts[m].c2;
          }
        }
        var path = cp.pathItems.add();
        for (m = 0; m < pts.length; m++) {
          var pp = path.pathPoints.add();
          pp.anchor = pts[m].a;
          pp.leftDirection = pts[m].l || pts[m].a;
          pp.rightDirection = pts[m].r || pts[m].a;
          pp.pointType = PointType.CORNER;
        }
        path.closed = true;
      }
      for (j = 0; j < cp.pathItems.length; j++) paint(cp.pathItems[j]);
    } else if (it.kind === 'diamond') {
      var d = K.pathItems.add();
      d.setEntirePath([[X(0, it.cx), Y(0, it.cy - it.h)], [X(0, it.cx + it.h), Y(0, it.cy)], [X(0, it.cx), Y(0, it.cy + it.h)], [X(0, it.cx - it.h), Y(0, it.cy)]]);
      d.closed = true; d.name = 'separator';
      paint(d);
    }
  }

  // 7) save next to this script
  var dest = new File(File($.fileName).parent + '/' + C.fileName);
  var opt = new IllustratorSaveOptions();
  opt.pdfCompatible = true;
  doc.saveAs(dest, opt);
  // outlined copy for print (no fonts needed at the print shop): *_outline.ai
  for (i = K.textFrames.length - 1; i >= 0; i--) K.textFrames[i].createOutline();
  var destO = new File(String(dest).replace(/\\.ai$/, '_outline.ai'));
  doc.saveAs(destO, opt);
  for (i = 0; i < files.length; i++) files[i].remove();
  tmp.remove();
  alert('\\uC644\\uB8CC\\n' + decodeURI(dest.fsName) + '\\n' + decodeURI(destO.fsName));
})();
`
