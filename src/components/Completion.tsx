import { useState } from 'react'
import type { CardData } from '../card/types'
import { Button, StepCard } from './ui'

interface Props {
  data: CardData
  onEdit: () => void
  onRestart: () => void
  className?: string
}

/** 완성 (왼쪽 카드) — 그래픽 면·정보 면은 오른쪽 카드에. 인쇄·제작 신청은 추후 연결 */
export function Completion({ data, onEdit, onRestart, className }: Props) {
  const [busy, setBusy] = useState<null | 'pdf' | 'ai'>(null)
  const [note, setNote] = useState<string | null>(null)
  const run = async (kind: 'pdf' | 'ai') => {
    setBusy(kind)
    setNote(null)
    try {
      if (kind === 'pdf') {
        const { generatePrintPdf, downloadPdf } = await import('../print/generatePdf')
        const r = await generatePrintPdf(data)
        downloadPdf(r)
        if (!r.printReady) setNote('영문 서체(Gotham) 파일이 없어 검수용 PDF로 받았어요.')
      } else {
        const [{ generateIllustratorScript }, { downloadFile }] = await Promise.all([import('../print/illustratorScript'), import('../print/generatePdf')])
        const r = await generateIllustratorScript(data)
        downloadFile('\uFEFF' + r.script, r.fileName, 'application/javascript')
        setNote('일러스트레이터에서 파일 › 스크립트 › 기타 스크립트로 받은 파일을 열면 .ai가 만들어져요.')
      }
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : String(e)
      setNote(/^(서체에|영문 서체)/.test(msg) ? msg : `파일을 만들지 못했어요. (${msg})`)
    } finally {
      setBusy(null)
    }
  }
  return (
    <StepCard
      className={className}
      title={
        <span className="flex flex-col gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          명함이 완성됐어요
        </span>
      }
      description="파일을 받아 명함 담당자에게 전달해 주세요."
      footer={
        <div className="flex flex-col gap-2">
          {note && (
            <p role="status" className="text-[13px] text-mute">
              {note}
            </p>
          )}
          <Button type="button" onClick={() => run('pdf')} disabled={!!busy}>
            {busy === 'pdf' ? 'PDF 만드는 중…' : '인쇄용 PDF 받기'}
          </Button>
          <Button type="button" variant="outline" onClick={() => run('ai')} disabled={!!busy}>
            {busy === 'ai' ? '파일 만드는 중…' : '일러스트레이터 파일 받기'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onEdit}>
              수정하기
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onRestart}>
              새로 만들기
            </Button>
          </div>
        </div>
      }
    />
  )
}
