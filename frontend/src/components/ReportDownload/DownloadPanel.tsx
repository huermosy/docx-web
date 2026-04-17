import { useState } from 'react'
import { qcApi } from '../../api/qcApi'
import { FileText, FileSpreadsheet, Loader2, BadgeCheck } from 'lucide-react'

interface DownloadPanelProps {
  taskId: string
  disabled?: boolean
  language?: 'zh' | 'en'
}

const COPY = {
  zh: {
    kicker: 'Delivery',
    title: '报告已准备就绪',
    description: '导出适合评审归档的 PDF，或导出适合继续修改的 Word 版本。',
    task: '任务',
    pdf: '下载 PDF',
    docx: '下载 Word',
  },
  en: {
    kicker: 'Delivery',
    title: 'Your report is ready',
    description: 'Export a PDF for review and archiving, or a Word file for further editing.',
    task: 'Task',
    pdf: 'Download PDF',
    docx: 'Download Word',
  },
} as const

export function DownloadPanel({ taskId, disabled, language = 'zh' }: DownloadPanelProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null)
  const t = COPY[language]

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setDownloading(format)
    try {
      const response = await qcApi.downloadReport(taskId, format)
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quality-report-${taskId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="download-shell">
      <div className="download-shell-header">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h3 className="download-title mt-2 text-xl font-semibold">{t.title}</h3>
          <p className="download-description mt-2">{t.description}</p>
        </div>
        <div className="download-card-note inline-flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          <span>{t.task}: {taskId}</span>
        </div>
      </div>

      <div className="download-actions">
        <button
          onClick={() => handleDownload('pdf')}
          disabled={disabled || downloading !== null}
          className="download-action download-action-primary"
        >
          {downloading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {t.pdf}
        </button>
        <button
          onClick={() => handleDownload('docx')}
          disabled={disabled || downloading !== null}
          className="download-action download-action-secondary"
        >
          {downloading === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          {t.docx}
        </button>
      </div>
    </div>
  )
}
