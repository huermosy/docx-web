import { useEffect, useMemo, useState } from 'react'
import { UploadZone } from './components/Upload/UploadZone'
import { DiagnosticPanel } from './components/DiagnosticPanel/Panel'
import { DownloadPanel } from './components/ReportDownload/DownloadPanel'
import { useQCAnalysis } from './hooks/useQCAnalysis'
import { qcApi, ConfigResponse } from './api/qcApi'
import { Loader2 } from 'lucide-react'

export default function App() {
  const { state, issues, error, taskId, llmAvailable, analyze } = useQCAnalysis()
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [configError, setConfigError] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateUploading, setTemplateUploading] = useState(false)
  const [templateError, setTemplateError] = useState('')

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await qcApi.getConfig()
        setConfig(data)
      } catch {
        setConfigError('检查标准加载失败')
      }
    }

    loadConfig()
  }, [])

  const standardEntries = useMemo(() => {
    if (!config) {
      return []
    }
    return Object.entries(config.standards)
  }, [config])

  const handleFileSelect = (file: File) => {
    analyze(file, Boolean(templateName))
  }

  const handleTemplateSelect = async (file: File) => {
    setTemplateUploading(true)
    setTemplateError('')

    try {
      const { data } = await qcApi.uploadTemplate(file)
      setTemplateName(data.filename)
    } catch (err: any) {
      setTemplateError(err.response?.data?.detail || '模板上传失败')
    } finally {
      setTemplateUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Word 文档质量检查工具</h1>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as 'zh' | 'en')}
            className="px-3 py-1 border rounded"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">上传文档</h2>
          <UploadZone
            onFileSelected={handleFileSelect}
            onTemplateSelected={handleTemplateSelect}
            disabled={state === 'uploading' || state === 'analyzing'}
            templateDisabled={templateUploading || state === 'uploading' || state === 'analyzing'}
            templateName={templateName}
          />

          {state === 'uploading' && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>正在上传文件...</span>
            </div>
          )}
          {state === 'analyzing' && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>正在分析文档，请稍候...</span>
            </div>
          )}
          {templateUploading && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>正在上传参考模板...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
              错误: {error}
            </div>
          )}
          {templateError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
              模板错误: {templateError}
            </div>
          )}
          {!llmAvailable && state === 'done' && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded">
              LLM 不可用，部分高级检查可能缺失
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">检查标准</h2>
            {config && (
              <span className="text-sm text-gray-500">
                文档限制：{config.allowed_extensions.join('、')}，最大 {config.max_file_size_mb}MB
              </span>
            )}
          </div>

          {configError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{configError}</div>
          )}

          {!config && !configError && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>正在加载检查标准...</span>
            </div>
          )}

          {config && (
            <div className="grid gap-4 md:grid-cols-2">
              {standardEntries.map(([key, category]) => (
                <div key={key} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{category.title}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {category.items.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {state === 'done' && (
          <>
            <DiagnosticPanel issues={issues} language={language} />
            <div className="mt-6">
              <DownloadPanel taskId={taskId} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
