import { useState } from 'react'
import { qcApi } from '../../api/qcApi'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

interface DownloadPanelProps {
  taskId: string
  disabled?: boolean
}

export function DownloadPanel({ taskId, disabled }: DownloadPanelProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null)

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
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">导出报告</h3>
      <div className="flex gap-3">
        <button
          onClick={() => handleDownload('pdf')}
          disabled={disabled || downloading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {downloading === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          下载 PDF
        </button>
        <button
          onClick={() => handleDownload('docx')}
          disabled={disabled || downloading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {downloading === 'docx' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          下载 Word
        </button>
      </div>
    </div>
  )
}
