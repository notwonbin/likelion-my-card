import { useEffect, useState } from 'react'

export interface FontStatus {
  ready: boolean
  /** 사용자 PC에 Gotham Bold가 설치되어 원본 서체로 표시 중인지 */
  gotham: boolean
}

/** 명함 서체 로드 상태. Gotham은 로컬 설치 여부를 확인한다. */
export function useCardFonts(): FontStatus {
  const [s, setS] = useState<FontStatus>({ ready: false, gotham: false })
  useEffect(() => {
    let alive = true
    Promise.all([
      document.fonts.load('700 10px "LL Gotham"', 'A'),
      document.fonts.load('700 10px "LL Gotham Fallback"', 'A'),
      document.fonts.load('800 10px "LL SUITE"', '가'),
      document.fonts.load('400 10px "LL Pretendard"', '@'),
    ])
      .then(([g]) => alive && setS({ ready: true, gotham: g.length > 0 }))
      .catch(() => alive && setS({ ready: true, gotham: false }))
    return () => {
      alive = false
    }
  }, [])
  return s
}
