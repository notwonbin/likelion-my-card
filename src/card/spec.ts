/**
 * LIKELION 명함 제작 사양
 * 출처: 250812_LIKELION_businesscard_fin_edit.ai (Illustrator 30, PDF 호환 저장)
 * 모든 좌표 단위는 pt (1pt = 1/72in), 원점은 도련 포함 아트보드 좌상단.
 * 값은 원본 PDF 콘텐츠 스트림에서 직접 추출했다. 임의로 수정하지 말 것.
 */

export const PT_PER_MM = 72 / 25.4

export const ARTBOARD = {
  /** 도련 포함 전체 (MediaBox / BleedBox) — 96 × 56 mm */
  width: 272.126,
  height: 158.74,
  /** 재단선 (TrimBox) — 90 × 50 mm */
  trim: { x: 8.5039, y: 8.504, width: 255.118, height: 141.732 },
  /** 도련 3mm */
  bleed: 8.5039,
  /** 안전 여백: 재단선 안쪽 5mm (원본 텍스트 좌측 시작 22.68pt, 최장 행 우측 끝 249.45pt와 일치) */
  safe: { left: 22.68, right: 249.45 },
} as const

/** 원본 CMYK 값과 화면 표시용 sRGB 근사값 (동일 변환기 기준) */
export const COLORS = {
  orange021c: { cmyk: [0, 70, 98, 0], screen: '#F37025', layer: 'orange_021c' },
  yellow127c: { cmyk: [0, 10, 68, 0], screen: '#FFDF6E', layer: 'yellow_127c' },
  textK98: { cmyk: [0, 0, 0, 98], screen: '#2A2728', layer: 'k' },
  black: { cmyk: [0, 0, 0, 100], screen: '#231F20', layer: 'k' },
  /** 실크 레이어 표시용 색 (원본 파일에서 후가공 판을 M100으로 표시) — 실제 인쇄색 아님 */
  silkIndicator: { cmyk: [0, 100, 0, 0], screen: '#EC008C', layer: '실크' },
} as const

/** 원본 레이어 (Illustrator 레이어 순서: 위 → 아래) */
export const LAYERS = [
  { name: 'spec', role: '제작 사양 메모 (아트보드 밖, PRINT_SPEC)', kind: 'guide' },
  { name: '실크', role: '후가공(실크) 판 — 뒷면 L자 프레임 + 주황 강조 문구 영역', kind: 'finish' },
  { name: 'orange_021c', role: '뒷면 강조 문구(<POSSIBILITY> 등)', kind: 'print' },
  { name: 'k', role: '검정 판 — 뒷면 박스·문구·심볼, 앞면 로고·주소·개인정보 텍스트', kind: 'print' },
  { name: 'orange_021c', role: '앞면 배경 / 뒷면 프레임 그라데이션', kind: 'print' },
  { name: 'yellow_127c', role: '뒷면 프레임 그라데이션 하이라이트', kind: 'print' },
] as const

export const FONTS = {
  /** 영문·숫자 */
  latin: { family: 'LL Gotham', postscript: 'Gotham-Bold', fallback: 'LL Gotham Fallback' },
  /** 한글 */
  hangul: { family: 'LL SUITE', postscript: 'SUITE-Heavy' },
  /**
   * 이메일의 '@' 한 글자만 Pretendard 사용.
   * PDF에는 'PretendardVariable-Regular'로 기록되지만 실제 적용 굵기는 Black(900) —
   * 임베드된 글리프의 외곽선·면적·폭이 Pretendard Black과 일치함.
   */
  at: { family: 'Pretendard', postscript: 'Pretendard-Black', weight: 900, note: '화면·PDF에는 원본 임베드 글리프 외곽선 사용 (typeset.ts AT_GLYPH)' },
} as const

/** 텍스트 스타일: size(pt), tracking(em, Illustrator Tc 값) */
export const TYPE = {
  nameEn: { size: 7.5, latinTracking: 0, hangulTracking: 0 },
  nameKo: { size: 7.5, latinTracking: 0, hangulTracking: -0.005 },
  affiliation: { size: 7.5, latinTracking: -0.01, hangulTracking: 0.02 },
  title: { size: 7.5, latinTracking: -0.01, hangulTracking: 0.02 },
  email: { size: 7.8, latinTracking: -0.01, hangulTracking: 0 },
  phone: { size: 7.5, latinTracking: 0, hangulTracking: 0 },
} as const

/**
 * 회사 주소 (앞면 하단, 고정 정보 — 구성원이 수정하지 않음)
 * 원본 주소는 아웃라인 처리돼 있었으며, 분석 결과 SUITE Heavy 7.5pt(한글·숫자·영문 모두), 자간 -10.
 * 2026-11 사옥 이전으로 문구만 교체, 서체·크기·위치·구분 기호는 원본 그대로.
 */
export const ADDRESS = {
  parts: ['서울특별시 강남구 테헤란로 132', '한독빌딩 9층'],
  x: 22.68,
  baseline: 135.03,
  size: 7.5,
  tracking: -0.01,
  /**
   * 구분 기호: 45° 회전 정사각형(마름모), 대각선 2.268pt, 중심 높이 132.255pt.
   * 원본의 눈에 보이는 간격(앞 글자 끝 → 마름모 2.05pt, 마름모 → 뒷 글자 1.76pt)을 유지하도록
   * 현재 문구의 앞뒤 글자('2', '한') 사이드베어링을 반영한 값. 주소 문구를 바꾸면 재계산 필요.
   */
  separator: { halfDiagonal: 1.134, centerY: 132.255, gapBefore: 1.82, gapAfter: 1.58 },
} as const

/** 앞면 가변 텍스트 배치 (baseline 기준) */
export const FRONT_LAYOUT = {
  left: { x: 22.68, nameEnBaseline: 28.66, nameKoBaseline: 38.34 },
  right: {
    x: 124.7,
    /** 이메일은 원본에서 'm'의 광학 보정으로 0.14pt 들여 시작 */
    emailX: 124.85,
    firstBaseline: 28.87,
    /** 소속·직책 행간 (원본 아트보드별 9.1~9.4pt, 대표값) */
    leading: 9.3,
    /** 마지막 소속/직책 행 → 이메일 baseline 간격 */
    contactGap: 16.1,
    /** 이메일 → 연락처 baseline 간격 */
    phoneGap: 10.4,
  },
  /** 좌측 이름 영역 최대 폭 (우측 칼럼과 최소 8pt 간격) */
  leftMaxWidth: 124.7 - 22.68 - 8,
  /** 우측 칼럼 최대 폭 (안전 여백까지) */
  rightMaxWidth: 249.45 - 124.7,
} as const

export const EMAIL_DOMAIN = 'likelion.net'

/**
 * 원본 'spec' 레이어의 제작 사양 메모 (아트보드 밖에 있어 PDF 호환 데이터에는 없음 — 원본 화면 기준 그대로 옮김)
 * 원본 메모의 'Orangr' 오타는 'Orange'로 바로잡음 (PANTONE Orange 021 C).
 */
export const PRINT_SPEC = {
  title: '<Print spec>',
  sections: [
    { label: '[지류]', lines: ['아르떼 310g'] },
    { label: '[후가공]', lines: ['전면 M 100% 실크 코팅', '측면 에칭 (Pantone Orange 021c)'] },
    { label: '[도수]', lines: ['별색 2도(Pantone Orange 021c, Pantone 127c) + 먹 1도'] },
  ],
} as const
