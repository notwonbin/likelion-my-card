/** 명함 가변 정보 — 원본 앞면에 존재하는 항목만 */
export interface CardData {
  /** 영문 이름 (대문자로 표기) */
  nameEn: string
  /** 국문 이름 */
  nameKo: string
  /**
   * 소속 — 명함 폭을 넘으면 자동으로 다음 줄로 넘어간다 (최대 2줄).
   * 줄바꿈 문자(\n) 하나로 원하는 위치에서 직접 나눌 수도 있다.
   * 예: "MANAGEMENT STRATEGY TEAM", "MANAGEMENT DIVISION\nMANAGEMENT STRATEGY TEAM"
   */
  affiliation: string
  /** 직책 — 예: MANAGER, CEO */
  title: string
  /** 이메일 아이디 (@likelion.net 고정) */
  emailId: string
  /** 휴대전화 (숫자만 저장, 표기는 010.1234.1234) */
  phone: string
}

export type CardSide = 'front' | 'back'

/** 미리보기 표시 모드 */
export type FinishView = 'print' | 'overlay' | 'plate'

export type FieldKey = keyof CardData
export type TextFieldKey = FieldKey
