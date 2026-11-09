import { EMAIL_DOMAIN } from './spec'
import type { CardData } from './types'

/** 명함 미리보기에 흐리게 보여주는 예시 (입력칸에는 들어가지 않는다) */
export const SAMPLE_DATA: CardData = {
  nameEn: 'MUTSA KIM',
  nameKo: '김멋사',
  affiliation: 'KDT 교육 Group\n교육기획 1 Team',
  title: 'MANAGER',
  emailId: 'mutsa',
  phone: '01012345678',
}

/** 휴대전화 앞자리 — 항상 010 */
export const PHONE_PREFIX = '010'

export const EMPTY_DATA: CardData = {
  nameEn: '',
  nameKo: '',
  affiliation: '',
  title: '',
  emailId: '',
  phone: PHONE_PREFIX,
}

/** 항목이 아직 비어 있는가 (휴대전화는 010만 있으면 빈 것) */
export const isEmptyField = (k: keyof CardData, d: CardData) => (k === 'phone' ? d.phone.length <= PHONE_PREFIX.length : !d[k].trim())

/** 원본 표기 규칙: 영문은 대문자 */
export const upperLatin = (s: string) => s.replace(/[a-z]/g, (c) => c.toUpperCase())

/** 원본 표기 규칙: 010.1234.1234 */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    return `${d.slice(0, 2)}.${d.slice(2, 6)}.${d.slice(6, 10)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 7)}.${d.slice(7, 11)}`
}

export const fullEmail = (id: string) => `${id}@${EMAIL_DOMAIN}`

/** 소속 입력 정리: 줄바꿈은 최대 1개(=2줄), 줄 앞뒤 공백 제거 */
export function normalizeAffiliation(v: string): string {
  const parts = v.replace(/\r/g, '').split('\n')
  return parts.length > 2 ? `${parts[0]}\n${parts.slice(1).join(' ')}` : parts.join('\n')
}
