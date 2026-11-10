# LIKELION My Card — 프로토타입

LIKELION 구성원이 기존 명함 디자인 그대로 자신의 명함 정보를 입력·검수하는 웹 빌더.
디자인 기준은 `../250812_LIKELION_businesscard_fin_edit.ai` 하나뿐이며, 분석 결과는 [`docs/ANALYSIS.md`](docs/ANALYSIS.md)에 있다.

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
```

- `npm run build` — 일반 정적 빌드 (`dist/`)
- `npm run build:single` — 폰트·이미지를 모두 담은 HTML 한 파일 (`dist-single/index.html`), 더블클릭으로 열림

### Gotham Bold

Gotham은 상용 서체라 번들하지 않는다. **PC에 Gotham Bold가 설치되어 있으면 자동으로 사용**하고, 없으면 화면 확인용 대체 서체(Montserrat Bold)로 표시하며 미리보기 하단에 그 사실을 안내한다. 대체 서체는 폭이 달라 안전영역 초과 판정도 근사치가 된다.

## 명함 신청 (구글 드라이브 자동 저장)

배포 환경변수 `VITE_SUBMIT_URL`(Google Apps Script 웹 앱 주소)이 있으면 확인 단계 버튼이 **신청할게요**가 된다.
누르면 일러 파일(.jsx)·확인용 PDF가 드라이브 폴더에 저장되고, 구글 시트에 기록되고, 담당자·신청자에게 메일이 간다.
없으면(로컬·`dist-single`) 예전처럼 완료 화면에서 파일을 직접 받는다. 설정 방법: `docs/SUBMIT_SETUP.md`

## 인쇄용 PDF

완료 화면의 **인쇄용 PDF 받기** → `src/print/generatePdf.ts` (브라우저에서 생성, 서버 없음).

| 쪽 | 내용 |
|---|---|
| 1 | 정보 면 — `print-templates/front-base.pdf`(원본 앞면, 레이어 유지) 위에 이름·소속·직책·이메일·연락처·주소를 원본 `k` 레이어 안에 K98 텍스트로 기록 (서체 포함, 커닝 적용, '@'는 원본 글리프 외곽선) |
| 2 | 그래픽 면 — `print-templates/back.pdf` (원본 뒷면, 실크 레이어 제외) |
| 3 | 실크 후가공 판 — `print-templates/back-silk.pdf` (원본 `실크` 레이어만, 표시색 M100 그대로) |

- 모든 쪽 96×56mm, TrimBox 90×50mm·BleedBox 원본 그대로. 색은 원본 정의(CMYK + 레이어별 판) 유지, 임의 별색 변환 없음.
- **Gotham Bold 필요**: ① Chrome·Edge에서 버튼을 누를 때 '글꼴 접근'을 허용하면 이 PC에 설치된 Gotham을 읽어 쓴다(서체 파일을 사이트에 올리지 않아도 됨). ② 또는 `public/fonts/Gotham-Bold.otf`(로컬 개발용, 저장소 제외)에 넣어 둔다. 없으면 대체 서체로 만들고 파일명·문서 제목에 `검수용`을 붙인다 — 인쇄에 쓰지 말 것. 서체에 없는 글자가 있으면 PDF를 만들지 않고 알려준다.
- `dist-single`(파일 더블클릭)로 열면 브라우저 보안상 `fonts/` 파일을 읽지 못해 항상 검수용이 된다. 인쇄용은 `npm run dev` 또는 웹 서버에 올린 `dist/`에서 받는다.

## 일러스트레이터 파일

완료 화면의 **일러스트레이터 파일 받기** → `명함_이름_날짜.jsx` (`src/print/illustratorScript.ts`).
일러스트레이터 › 파일 › 스크립트 › 기타 스크립트에서 이 파일을 열면, 같은 폴더에 `명함_이름_날짜.ai`가 저장된다.

- 레이어(위→아래) `spec · 실크 · orange_021c · k · orange_021c · yellow_127c` — 원본과 같은 이름·순서
- 아트보드 2개(정보 면 / 그래픽 면), 재단 90×50mm, 도련 3mm, CMYK 문서
- 그래픽은 원본에서 레이어별로 나눈 벡터(`print-templates/layers/*.pdf`, 스크립트 안에 포함)를 해당 레이어에 넣음
- 개인정보·주소는 `k` 레이어의 살아 있는 텍스트(Gotham-Bold / SUITE-Heavy, K98, 원본 자간). '@'는 원본 글리프 외곽선, 주소 구분 기호는 마름모 도형
- 실행하는 맥에 Gotham-Bold, SUITE-Heavy 서체가 설치돼 있어야 함 (없으면 알림 후 중단)
- `spec` 레이어: 원본 제작 사양 메모를 정보 면 위(아트보드 밖)에 흰 바탕 + Pretendard 아웃라인으로 넣음. 문구는 `src/card/spec.ts`의 `PRINT_SPEC`, 바꾸면 `python3 scripts/outline_spec.py`로 외곽선(`src/print/specOutline.json`)을 다시 만든다
- 위치는 인쇄용 PDF와 같은 계산(`src/print/layout.ts`)을 사용. Gotham 폭에 따라 달라지는 이메일 '@'·도메인 위치만 일러스트레이터 안에서 직접 재서 정하므로, 웹에 Gotham이 없어도 만들 수 있다

## 구조

```
src/
  card/                     명함 도메인 (UI와 무관, PDF 생성 시 재사용)
    spec.ts                 원본에서 추출한 제작 사양 — 크기·좌표·서체·자간·컬러·레이어
    types.ts                CardData (원본 앞면에 있는 항목만)
    format.ts               표기 규칙 (대문자, 010.1234.1234, @likelion.net)
    validation.ts           필수·형식 검증
    typeset.ts              조판 규칙(서체 런 분리) · 실제 서체 폭 측정 · 소속 자동 줄바꿈 · 명함 영역 초과 입력 차단
    CardFace.tsx            SVG 명함 컴포넌트 (layer 그룹: fixed / variable / print / finish / guides)
    useCardFonts.ts         서체 로드 · Gotham 설치 여부 확인
  components/               Header, StepIndicator, InformationForm,
                            BusinessCardPreview, Confirmation, Completion
  assets/card/              원본에서 추출한 고정 요소 (front-base.svg, back-print.webp, back-silk.svg)
print-templates/            원본 페이지를 레이어 유지한 채 추출한 벡터 PDF (향후 인쇄 PDF용)
docs/                       분석 문서와 검증 이미지
```

## 입력 규칙

- 입력칸은 빈 상태로 시작하고, 명함 미리보기에는 아직 입력하지 않은 항목만 예시(김멋사 등)를 흐리게 보여준다. 예시가 그대로 확정되지 않는다.
- **소속**: `src/data/org.ts`(2026-11 조직도)에서 팀을 검색해 고른다(조직명·별칭 검색). 기본은 팀 이름 1줄, "○○ 함께 표기"를 켜면 "상위 조직 / 팀" 2줄(예: KDT 교육 GROUP / 교육기획 1 TEAM). 목록에 없으면 직접 입력. 조직 개편 시 `org.ts`만 수정.
- **직책**: CEO · CMO · CFO · DIRECTOR · HEAD · GROUP LEAD · TEAM LEAD · MANAGER(높은 순) 중 선택, 또는 직접 입력.
- 화면: 모든 단계가 같은 틀(왼쪽 카드 + 오른쪽 명함 카드), 데스크톱 카드 높이 530px 고정(`STEP_CARD_HEIGHT`), 화면 세로 가운데. 뒷면(그래픽 면)은 완성 화면에서만 표시.
- **휴대전화**: `010.` 고정, 뒤 8자리만 입력.

- 소속은 입력칸 하나. 명함 폭(우측 칼럼 124.75pt)을 넘으면 **단어 단위로 자동 줄바꿈**(한 단어가 너무 길면 글자 단위), Enter로 원하는 위치에서 직접 나눌 수도 있다. 최대 2줄 → 직책 포함 우측 칼럼 최대 3줄(원본 아트보드 3·6·7과 동일). 줄 수에 따라 이메일·연락처가 원본 간격대로 내려간다.
- 모든 항목은 입력 즉시 실제 명함 서체로 폭을 재서, 명함 영역(좌측 이름 칼럼 94pt, 우측 칼럼 124.75pt = 안전여백까지)을 넘는 글자는 받지 않는다. 붙여넣기는 들어가는 만큼만 남긴다. 한글 조합 중에는 입력칸을 건드리지 않고 미리보기에만 들어가는 만큼 표시한 뒤, 조합이 끝나면 정리한다.
- 미리보기는 칼럼별로 영역 밖을 잘라 그려서, 어떤 경우에도 좌우 칼럼이 겹치거나 명함 밖으로 나가지 않는다.
- Gotham이 설치되지 않은 PC에서는 폭이 더 넓은 대체 서체로 측정하므로 허용 글자 수가 실제보다 조금 적다.

## 확장 포인트

- **별색 지정**: 인쇄소가 팬톤 별색 PDF를 요구하면 `src/print/generatePdf.ts`에서 레이어별 색 정의만 바꾸면 된다(현재는 원본 그대로 CMYK).
- **구성원 정보 자동 입력 / Google Sheets**: `CardData` 형태로 받아 `setData`에 주입.
- **완료 화면 다음 단계**: `Completion.tsx`의 `NEXT_ACTIONS`.
