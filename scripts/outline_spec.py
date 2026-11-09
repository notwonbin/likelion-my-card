"""제작 사양 메모(src/card/spec.ts PRINT_SPEC)를 Pretendard 외곽선으로 변환 → src/print/specOutline.json
실행: python3 scripts/outline_spec.py   (사양 문구를 바꾸면 다시 실행, fontTools 필요)
좌표: pt, 블록 왼쪽 위 원점, y는 아래로 +. 점 형식: [x, y] 또는 곡선 [x, y, c1x, c1y, c2x, c2y]
"""
import json, re, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'src/card/spec.ts').read_text(encoding='utf-8')
block = src[src.index('export const PRINT_SPEC'):]
title = re.search(r"title: '([^']*)'", block).group(1)
sections = [(m.group(1), re.findall(r"'([^']*)'", m.group(2))) for m in re.finditer(r"\{ label: '([^']*)', lines: \[([^\]]*)\] \}", block)]

FONTS = ROOT / 'node_modules/pretendard/dist/public/static'
def load(w):
    f = TTFont(FONTS / f'Pretendard-{w}.otf')
    return f, f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
TITLE = (load('SemiBold'), 11.0)
BODY = (load('Bold'), 8.5)
LEAD, SECTION_GAP, TITLE_GAP = 12.0, 8.0, 14.0
r = lambda n: round(n, 3)

def kern_pairs(font):
    """GPOS PairPos 형식 1(글리프 쌍)만 — 메모용으로 충분"""
    pairs = {}
    if 'GPOS' not in font: return pairs
    for lookup in font['GPOS'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            st = getattr(st, 'ExtSubTable', st)
            if getattr(st, 'LookupType', lookup.LookupType) != 2 or st.Format != 1: continue
            cov = st.Coverage.glyphs
            for i, ps in enumerate(st.PairSet):
                for pv in ps.PairValueRecord:
                    v = getattr(pv.Value1, 'XAdvance', 0) if pv.Value1 else 0
                    if v: pairs[(cov[i], pv.SecondGlyph)] = v
    return pairs

def outline(text, style, x0, base):
    (font, gs, cmap, upm), size = style
    k = size / upm
    pairs = kern_pairs(font) if not hasattr(font, '_kp') else font._kp
    font._kp = pairs
    hmtx = font['hmtx']
    contours, pen, prev = [], 0.0, None
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None: raise SystemExit(f'Pretendard에 없는 글자: {ch!r}')
        if prev: pen += pairs.get((prev, g), 0)
        rp = DecomposingRecordingPen(gs); gs[g].draw(rp)
        P = lambda x, y: [r(x0 + (pen + x) * k), r(base - y * k)]
        cur, last = None, (0, 0)
        for op, args in rp.value:
            if op == 'moveTo':
                if cur: contours.append(cur)
                cur = [P(*args[0])]; last = args[0]
            elif op == 'lineTo':
                cur.append(P(*args[0])); last = args[0]
            elif op == 'curveTo':
                c1, c2, e = args; cur.append(P(*e) + P(*c1) + P(*c2)); last = e
            elif op == 'qCurveTo':
                # 2차 곡선(드묾) → 3차
                pts = list(args)
                for i in range(len(pts) - 1):
                    q = pts[i]; e = pts[i + 1] if i == len(pts) - 2 else ((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
                    c1 = (last[0] + 2 / 3 * (q[0] - last[0]), last[1] + 2 / 3 * (q[1] - last[1])); c2 = (e[0] + 2 / 3 * (q[0] - e[0]), e[1] + 2 / 3 * (q[1] - e[1]))
                    cur.append(P(*e) + P(*c1) + P(*c2)); last = e
            elif op in ('closePath', 'endPath'):
                if cur: contours.append(cur)
                cur = None
        if cur: contours.append(cur)
        pen += hmtx[g][0]; prev = g
    return {'text': text, 'contours': contours, 'width': r(pen * k)}

lines, y = [], TITLE[1] * 0.8
lines.append(outline(title, TITLE, 0, y)); y += TITLE_GAP
for i, (label, ls) in enumerate(sections):
    if i: y += SECTION_GAP
    for t in [label, *ls]:
        y += LEAD; lines.append(outline(t, BODY, 0, y))
out = {'width': r(max(l['width'] for l in lines)), 'height': r(y + BODY[1] * 0.25), 'lines': lines}
(ROOT / 'src/print/specOutline.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('lines', len(lines), 'width', out['width'], 'height', out['height'], 'contours', sum(len(l['contours']) for l in lines))
