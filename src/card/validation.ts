import type { CardData, FieldKey } from './types'

export type Errors = Partial<Record<FieldKey, string>>

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/
/** 원본 서체(Gotham Bold · SUITE Heavy)로 표기 가능한 문자만 허용 */
const CARD_CHARS = /^[A-Za-z0-9ᄀ-ᇿ㄰-㆏가-힯 .,&()\-/'·]*$/

export function validate(d: CardData): Errors {
  const e: Errors = {}
  const req = (k: FieldKey, label: string) => {
    if (!d[k].trim()) e[k] = `${label}${eulReul(label)} 입력해주세요.`
  }

  req('nameEn', '영문 이름')
  if (!e.nameEn && !/^[A-Za-z][A-Za-z .'-]*$/.test(d.nameEn.trim())) e.nameEn = '영문 알파벳으로 입력해주세요.'

  req('nameKo', '국문 이름')
  if (!e.nameKo && !/^[가-힯 ]+$/.test(d.nameKo.trim())) e.nameKo = '한글로 입력해주세요.'

  req('affiliation', '소속')
  for (const k of ['affiliation', 'title'] as const) {
    if (!e[k] && d[k] && !CARD_CHARS.test(d[k].replace(/\n/g, ' '))) e[k] = '명함 서체로 표기할 수 없는 문자가 포함되어 있어요.'
  }

  req('title', '직책')

  req('emailId', '이메일')
  if (!e.emailId && !/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i.test(d.emailId.trim()))
    e.emailId = '영문 소문자, 숫자, . _ - 만 쓸 수 있어요.'

  const digits = d.phone.replace(/\D/g, '')
  if (digits.length <= 3) e.phone = '휴대전화 번호를 입력해주세요.'
  else if (!/^010\d{8}$/.test(digits)) e.phone = '010 뒤 8자리를 모두 입력해주세요.'

  return e
}

export const isHangul = (ch: string) => HANGUL.test(ch)

/** 받침 유무에 따른 목적격 조사 (을/를) */
function eulReul(word: string) {
  const c = word.trim().slice(-1).charCodeAt(0)
  if (c < 0xac00 || c > 0xd7a3) return '을(를)'
  return (c - 0xac00) % 28 ? '을' : '를'
}
