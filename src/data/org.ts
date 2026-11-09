/**
 * LIKELION 조직 구조 — 2026-11 조직도 이미지 기준 (조직명만, 인명 제외)
 * 조직 개편 시 이 파일만 수정하면 된다. (추후 Google Sheets 연동 시 같은 형태로 불러오기)
 *
 * 명함 소속 표기 규칙: 선택한 조직 + 바로 위 상위 조직 (최대 2줄)
 *   예) 교육기획 1 Team → "KDT 교육 GROUP / 교육기획 1 TEAM"  (원본 아트보드 6과 같은 방식)
 *   CEO·CMO 같은 최상위 직속 조직의 상위는 표기하지 않는다.
 */

export type OrgKind = 'company' | 'division' | 'lab' | 'group' | 'chapter' | 'team' | 'squad'

export interface OrgUnit {
  id: string
  /** 조직도 표기 그대로 (명함에서는 영문 대문자로 바뀜) */
  name: string
  kind: OrgKind
  parentId?: string
  /** 검색용 별칭 */
  alias?: string
}

export const ORG: OrgUnit[] = [
  { id: 'likelion', name: '멋쟁이사자처럼', kind: 'company', alias: '대표 경영진 CEO 본사' },

  // ── CEO 직속
  { id: 'axp', name: 'AXP Division', kind: 'division' },
  { id: 'axp-dev', name: 'Dev Team', kind: 'team', parentId: 'axp', alias: '개발' },
  { id: 'axp-xd', name: 'XD Team', kind: 'team', parentId: 'axp', alias: '경험 디자인' },

  { id: 'axbiz', name: 'AX사업본부', kind: 'division' },
  { id: 'axbiz-univ', name: '대학사업 Team', kind: 'team', parentId: 'axbiz' },
  { id: 'axbiz-hack', name: 'AX해커톤 Team', kind: 'team', parentId: 'axbiz' },
  { id: 'axbiz-edu', name: 'AX교육 Team', kind: 'team', parentId: 'axbiz' },
  { id: 'axbiz-new', name: 'AX신사업 Team', kind: 'team', parentId: 'axbiz' },

  { id: 'us', name: 'LIKELION US', kind: 'division', alias: '미국' },
  { id: 'us-community', name: 'Community Team', kind: 'team', parentId: 'us', alias: '커뮤니티' },

  { id: 'gnb', name: 'Global New Biz Group', kind: 'group', alias: '글로벌 신사업' },
  { id: 'gnb-kr', name: 'KR Team', kind: 'team', parentId: 'gnb', alias: '한국' },
  { id: 'gnb-vn', name: 'LIKELION VN', kind: 'team', parentId: 'gnb', alias: '베트남' },

  { id: 'gb2g', name: 'Global B2G Group', kind: 'group', alias: '글로벌' },
  { id: 'gb2g-biz', name: 'Business Team', kind: 'team', parentId: 'gb2g', alias: '비즈니스' },

  { id: 'mgmt', name: 'Management Division', kind: 'division', alias: '경영 경영지원' },
  { id: 'hr', name: 'HR Group', kind: 'group', parentId: 'mgmt', alias: '인사' },
  { id: 'hr-team', name: 'HR Team', kind: 'team', parentId: 'hr', alias: '인사' },
  { id: 'mgmt-ga', name: 'GA Team', kind: 'team', parentId: 'mgmt', alias: '총무' },
  { id: 'mgmt-fa', name: 'FA Team', kind: 'team', parentId: 'mgmt', alias: '재무 회계' },

  // ── CMO 직속
  { id: 'mkt', name: 'Marketing Division', kind: 'division', alias: '마케팅' },
  { id: 'pmc', name: 'Product MKT Chapter', kind: 'chapter', parentId: 'mkt', alias: '프로덕트 마케팅' },
  { id: 'pmc-edu', name: 'EDU Growth Squad', kind: 'squad', parentId: 'pmc', alias: '교육 그로스' },
  { id: 'cdc', name: 'Customer Decision Chapter', kind: 'chapter', parentId: 'mkt', alias: '고객' },
  { id: 'cdc-exec', name: 'C.D. Execution', kind: 'team', parentId: 'cdc', alias: 'CD' },
  { id: 'cdc-brand', name: 'Brand Execution', kind: 'team', parentId: 'cdc', alias: '브랜드' },

  { id: 'nbgs', name: 'New Biz Growth Squad', kind: 'squad', alias: '신사업 그로스' },

  { id: 'bdl', name: 'Brand Design Lab', kind: 'lab', alias: '브랜드 디자인' },
  { id: 'bdl-vc', name: 'Visual Communication Team', kind: 'team', parentId: 'bdl', alias: '비주얼 커뮤니케이션 디자인' },
  { id: 'bdl-bx1', name: 'BX 1 Team', kind: 'team', parentId: 'bdl', alias: '브랜드 경험' },
  { id: 'bdl-bx2', name: 'BX 2 Team', kind: 'team', parentId: 'bdl', alias: '브랜드 경험' },

  { id: 'itlab', name: 'IT Lab', kind: 'lab', alias: '아이티랩' },
  { id: 'kdt', name: 'KDT 교육 Group', kind: 'group', parentId: 'itlab', alias: '부트캠프' },
  { id: 'kdt-edu1', name: '교육기획 1 Team', kind: 'team', parentId: 'kdt' },
  { id: 'kdt-edu2', name: '교육기획 2 Team', kind: 'team', parentId: 'kdt' },
  { id: 'kdt-mgmt', name: 'IT Lab. Management Team', kind: 'team', parentId: 'kdt', alias: '운영' },
  { id: 'kdt-career', name: 'Career Team', kind: 'team', parentId: 'kdt', alias: '커리어 취업' },
  { id: 'nbs', name: '신규사업 전략 Group', kind: 'group', parentId: 'itlab' },
  { id: 'nbs-growth', name: 'Growth Strategy Team', kind: 'team', parentId: 'nbs', alias: '성장 전략' },
  { id: 'nbs-exec', name: 'New Biz Execution Team', kind: 'team', parentId: 'nbs', alias: '신사업 실행' },
  { id: 'knd', name: 'K뉴딜사업 Group', kind: 'group', parentId: 'itlab', alias: '뉴딜' },
]

const byId = new Map(ORG.map((u) => [u.id, u]))
export const getUnit = (id: string | null | undefined) => (id ? byId.get(id) : undefined)
export const parentOf = (u: OrgUnit) => getUnit(u.parentId)

/** 조직도상 경로 (표시용) — 예: "IT Lab › KDT 교육 Group" */
export function pathOf(u: OrgUnit): string {
  const chain: string[] = []
  let p = parentOf(u)
  while (p) {
    chain.unshift(p.name)
    p = parentOf(p)
  }
  return chain.join(' › ')
}

/** 명함 소속 문자열 (\n = 줄바꿈) */
export function affiliationOf(u: OrgUnit, includeParent: boolean): string {
  const p = parentOf(u)
  return includeParent && p ? `${p.name}\n${u.name}` : u.name
}

/** 검색 — 조직명·별칭, 대소문자·공백 무시 */
export function searchOrg(q: string): OrgUnit[] {
  const norm = (s: string) => s.toLowerCase().replace(/[\s.·]/g, '')
  const nq = norm(q)
  if (!nq) return ORG
  return ORG.filter((u) => norm(`${u.name}${u.alias ?? ''}`).includes(nq))
}

/** 직책 선택지 — 높은 순서 (조직도 직함 + 원본 명함의 MANAGER) */
export const TITLES: { value: string; desc: string }[] = [
  { value: 'CEO', desc: '' },
  { value: 'CMO', desc: '' },
  { value: 'CFO', desc: '' },
  { value: 'DIRECTOR', desc: '본부장' },
  { value: 'HEAD', desc: '부문·랩 리드' },
  { value: 'GROUP LEAD', desc: '그룹·챕터 리드' },
  { value: 'TEAM LEAD', desc: '팀 리드' },
  { value: 'MANAGER', desc: '구성원' },
]
