import { useEffect, useMemo, useState } from 'react'
import { UploadZone } from './components/Upload/UploadZone'
import { DiagnosticPanel } from './components/DiagnosticPanel/Panel'
import { DownloadPanel } from './components/ReportDownload/DownloadPanel'
import { useQCAnalysis } from './hooks/useQCAnalysis'
import { qcApi, ConfigResponse } from './api/qcApi'
import { ParticleBackground } from './components/Background/ParticleBackground'
import { Loader2, Sparkles, ShieldCheck, FileText, Wand2 } from 'lucide-react'

const COPY = {
  zh: {
    navItems: [
      { label: '上传文档', href: '#upload' },
      { label: '检查维度', href: '#standards' },
      { label: '诊断结果', href: '#results' },
    ],
    brandTitle: '文档质检工作台',
    effectsOn: '动效开',
    effectsOff: '动效关',
    heroKicker: 'Editorial Command Center',
    heroTitle: '让正式文档进入一套更专业的质检流程。',
    heroDescription: '上传待检文档，叠加参考模板，系统会按结构、版式、语言与一致性维度生成诊断结果，并交付可下载报告。',
    heroPrimary: '开始文档质检',
    heroSecondary: '查看结果区域',
    currentStatus: '当前状态',
    currentStatusHint: '围绕现有状态机派生展示，不改变业务流程',
    summaryTitle: '诊断摘要',
    summaryIssueCount: '问题数',
    summaryTemplate: '模板增强',
    summaryMode: '诊断模式',
    ribbon1: '结构、语言、版式、多维审校',
    ribbon2: '结果按严重度分层呈现',
    ribbon3: '支持 PDF / Word 报告导出',
    workspaceKicker: 'Workspace',
    workspaceTitle: '开始一次文档质检',
    workspaceDescription: '主文档上传是主入口，参考模板作为增强模式加入，不改变你的现有操作路径。',
    maxSize: '最大',
    uploading: '文件正在进入工作台，请稍候。',
    analyzing: '系统正在执行规则与智能诊断。',
    templateUploading: '参考模板上传中，完成后将进入增强模式。',
    error: '错误',
    templateError: '模板错误',
    llmUnavailable: '当前结果主要基于规则检查，智能复核未参与本次分析。',
    standardsKicker: 'Audit Matrix',
    standardsTitle: '检查维度',
    standardsSummary: '围绕该维度展开自动审校与异常定位。',
    loadingStandards: '正在加载检查标准...',
    loadStandardsFailed: '检查标准加载失败',
    resultsKicker: 'Results Workspace',
    resultsTitle: '诊断结果与报告交付',
    resultsDescription: '先定位问题，再直接导出适合评审或继续修改的报告格式。',
    taskId: '任务 ID',
    statusMeta: {
      idle: '等待上传',
      uploading: '文件进入工作台',
      analyzing: '正在执行质量诊断',
      done: '报告已生成',
      error: '分析失败',
    },
  },
  en: {
    navItems: [
      { label: 'Upload', href: '#upload' },
      { label: 'Standards', href: '#standards' },
      { label: 'Results', href: '#results' },
    ],
    brandTitle: 'Document Quality Console',
    effectsOn: 'Effects On',
    effectsOff: 'Effects Off',
    heroKicker: 'Editorial Command Center',
    heroTitle: 'Bring formal documents into a more professional quality workflow.',
    heroDescription: 'Upload the document, add an optional reference template, and get structured findings across layout, language, formatting, and consistency with downloadable reports.',
    heroPrimary: 'Start Inspection',
    heroSecondary: 'View Results',
    currentStatus: 'Current Status',
    currentStatusHint: 'Presentation derives from the existing state machine without changing the workflow.',
    summaryTitle: 'Diagnosis Summary',
    summaryIssueCount: 'Issues',
    summaryTemplate: 'Template',
    summaryMode: 'Mode',
    ribbon1: 'Structure, language, layout, and multi-dimensional review',
    ribbon2: 'Results grouped by severity',
    ribbon3: 'Export PDF and Word reports',
    workspaceKicker: 'Workspace',
    workspaceTitle: 'Start a Document Inspection',
    workspaceDescription: 'The main document remains the primary entry, while the reference template acts as an enhancement layer.',
    maxSize: 'Max',
    uploading: 'The file is entering the workspace. Please wait.',
    analyzing: 'The system is running rule-based and intelligent diagnostics.',
    templateUploading: 'Uploading the reference template. Enhanced mode will be enabled when finished.',
    error: 'Error',
    templateError: 'Template Error',
    llmUnavailable: 'The current result is based mainly on rule checks. LLM review did not participate in this run.',
    standardsKicker: 'Audit Matrix',
    standardsTitle: 'Inspection Dimensions',
    standardsSummary: 'Automated review and anomaly detection are performed across this dimension.',
    loadingStandards: 'Loading inspection standards...',
    loadStandardsFailed: 'Failed to load inspection standards',
    resultsKicker: 'Results Workspace',
    resultsTitle: 'Findings and Report Delivery',
    resultsDescription: 'Review the findings first, then export the format best suited for review or further editing.',
    taskId: 'Task ID',
    statusMeta: {
      idle: 'Waiting for upload',
      uploading: 'File entering workspace',
      analyzing: 'Running quality diagnostics',
      done: 'Report generated',
      error: 'Analysis failed',
    },
  },
} as const

const statusMeta = {
  idle: { tone: 'neutral' },
  uploading: { tone: 'info' },
  analyzing: { tone: 'info' },
  done: { tone: 'success' },
  error: { tone: 'danger' },
} as const

export default function App() {
  const { state, issues, error, taskId, llmAvailable, analyze } = useQCAnalysis()
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [configError, setConfigError] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateUploading, setTemplateUploading] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const [effectsEnabled, setEffectsEnabled] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await qcApi.getConfig()
        setConfig(data)
        setConfigError('')
      } catch {
        setConfigError('__load_failed__')
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
      setTemplateError(err.response?.data?.detail || '__template_failed__')
    } finally {
      setTemplateUploading(false)
    }
  }

  const t = COPY[language]
  const currentStatus = {
    ...statusMeta[state],
    label: t.statusMeta[state],
  }
  const issueCount = issues.length

  return (
    <div className="cinematic-page min-h-screen overflow-hidden bg-black text-[#E8E5D6]">
      <ParticleBackground enabled={effectsEnabled} />
      <div className="page-ambient" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />

      <header className="fixed left-1/2 top-5 z-40 w-[94%] max-w-7xl -translate-x-1/2">
        <nav className="command-nav mx-auto flex items-center justify-between gap-3 rounded-full px-3 py-2 md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="command-mark">DQ</div>
            <div className="min-w-0">
              <div className="truncate text-[11px] uppercase tracking-[0.34em] text-[#b9c7d8] md:text-xs">Document Qualify</div>
              <div className="truncate text-sm text-[#F4F1E6] md:text-base">{t.brandTitle}</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {t.navItems.map(item => (
              <a key={item.href} href={item.href} className="nav-pill">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEffectsEnabled(prev => !prev)}
              aria-pressed={effectsEnabled}
              className="control-pill"
            >
              {effectsEnabled ? t.effectsOn : t.effectsOff}
            </button>
            <div className="language-switch" role="tablist" aria-label="Language switcher">
              <button
                type="button"
                role="tab"
                aria-selected={language === 'zh'}
                onClick={() => setLanguage('zh')}
                className={`language-switch__item ${language === 'zh' ? 'language-switch__item--active' : ''}`}
              >
                中文
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={language === 'en'}
                onClick={() => setLanguage('en')}
                className={`language-switch__item ${language === 'en' ? 'language-switch__item--active' : ''}`}
              >
                EN
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-28 md:pt-32">
        <section className="hero-shell reveal-soft">
          <div className="hero-copy">
            <div className="hero-kicker">{t.heroKicker}</div>
            <h1 className="hero-title">{t.heroTitle}</h1>
            <p className="hero-description">{t.heroDescription}</p>

            <div className="flex flex-wrap gap-3">
              <a href="#upload" className="primary-action">
                {t.heroPrimary}
              </a>
              <a href="#results" className="secondary-action">
                {t.heroSecondary}
              </a>
            </div>
          </div>

          <div className="hero-insight-panel">
            <div className="status-card-grid">
              <div className="status-panel status-panel-accent">
                <span className="status-eyebrow">{t.currentStatus}</span>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`status-dot status-dot-${currentStatus.tone}`} />
                  <div>
                    <div className="text-sm text-[#f4f1e6]">{currentStatus.label}</div>
                    <div className="text-xs text-[#90a0b7]">{t.currentStatusHint}</div>
                  </div>
                </div>
              </div>

              <div className="status-panel">
                <span className="status-eyebrow">{t.summaryTitle}</span>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="metric-value">{issueCount}</div>
                    <div className="metric-label">{t.summaryIssueCount}</div>
                  </div>
                  <div>
                    <div className="metric-value">{templateName ? 'ON' : 'OFF'}</div>
                    <div className="metric-label">{t.summaryTemplate}</div>
                  </div>
                  <div>
                    <div className="metric-value">{llmAvailable ? 'LLM' : 'RULE'}</div>
                    <div className="metric-label">{t.summaryMode}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-ribbon">
              <div className="hero-ribbon-card">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>{t.ribbon1}</span>
              </div>
              <div className="hero-ribbon-card">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>{t.ribbon2}</span>
              </div>
              <div className="hero-ribbon-card">
                <FileText className="h-4 w-4 text-amber-300" />
                <span>{t.ribbon3}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace-shell reveal-soft reveal-delay-1">
          <div id="upload" className="workspace-primary scroll-mt-28">
            <div className="section-header-block">
              <div>
                <p className="section-kicker">{t.workspaceKicker}</p>
                <h2 className="section-title">{t.workspaceTitle}</h2>
                <p className="section-description">{t.workspaceDescription}</p>
              </div>
              <div className="section-badge-row">
                {config && <span className="info-chip">{config.allowed_extensions.join(' / ')}</span>}
                {config && <span className="info-chip">{t.maxSize} {config.max_file_size_mb}MB</span>}
              </div>
            </div>

            <UploadZone
              onFileSelected={handleFileSelect}
              onTemplateSelected={handleTemplateSelect}
              disabled={state === 'uploading' || state === 'analyzing'}
              templateDisabled={templateUploading || state === 'uploading' || state === 'analyzing'}
              templateName={templateName}
              language={language}
            />

            <div className="feedback-stack">
              {state === 'uploading' && (
                <div className="feedback-banner feedback-banner-info">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.uploading}</span>
                </div>
              )}
              {state === 'analyzing' && (
                <div className="feedback-banner feedback-banner-info">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.analyzing}</span>
                </div>
              )}
              {templateUploading && (
                <div className="feedback-banner feedback-banner-success">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.templateUploading}</span>
                </div>
              )}
              {error && <div className="feedback-banner feedback-banner-danger">{t.error}: {error}</div>}
              {templateError && (
                <div className="feedback-banner feedback-banner-danger">
                  {t.templateError}: {templateError === '__template_failed__' ? t.templateError : templateError}
                </div>
              )}
              {!llmAvailable && state === 'done' && (
                <div className="feedback-banner feedback-banner-warning">
                  <Wand2 className="h-4 w-4" />
                  <span>{t.llmUnavailable}</span>
                </div>
              )}
            </div>
          </div>

          <aside id="standards" className="workspace-secondary scroll-mt-28">
            <div className="section-header-block compact">
              <div>
                <p className="section-kicker">{t.standardsKicker}</p>
                <h2 className="section-title">{t.standardsTitle}</h2>
              </div>
            </div>

            {configError && (
              <div className="feedback-banner feedback-banner-danger">
                {configError === '__load_failed__' ? t.loadStandardsFailed : configError}
              </div>
            )}

            {!config && !configError && (
              <div className="feedback-banner feedback-banner-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.loadingStandards}</span>
              </div>
            )}

            {config && (
              <div className="standards-stack">
                {standardEntries.map(([key, category], index) => (
                  <div key={key} className="standard-card">
                    <div className="standard-card-header">
                      <span className="standard-index">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="standard-title">{category.title}</h3>
                        <p className="standard-summary">{t.standardsSummary}</p>
                      </div>
                    </div>
                    <ul className="standard-list">
                      {category.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section id="results" className="results-shell scroll-mt-28 reveal-soft reveal-delay-2">
          <div className="section-header-block mb-5">
            <div>
              <p className="section-kicker">{t.resultsKicker}</p>
              <h2 className="section-title">{t.resultsTitle}</h2>
              <p className="section-description">{t.resultsDescription}</p>
            </div>
            {taskId && <span className="info-chip">{t.taskId}: {taskId}</span>}
          </div>

          <div className="space-y-5">
            <DiagnosticPanel issues={issues} language={language} />
            {state === 'done' && <DownloadPanel taskId={taskId} language={language} />}
          </div>
        </section>
      </main>
    </div>
  )
}
