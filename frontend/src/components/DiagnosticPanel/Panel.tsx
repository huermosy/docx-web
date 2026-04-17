import { useState } from 'react'
import { Issue } from '../../api/qcApi'
import { IssueCard } from './IssueCard'
import { EmptyState } from './EmptyState'
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info, ListChecks } from 'lucide-react'

interface DiagnosticPanelProps {
  issues: Issue[]
  language?: string
}

const CATEGORY_LABELS = {
  zh: {
    layout: '页面布局',
    typography: '字体段落',
    heading: '标题结构',
    figure: '图表与引用',
    spelling: '拼写与语法',
    terminology: '术语统一性',
    consistency: '标题一致性',
  },
  en: {
    layout: 'Layout',
    typography: 'Typography',
    heading: 'Heading Structure',
    figure: 'Figures & References',
    spelling: 'Spelling & Grammar',
    terminology: 'Terminology',
    consistency: 'Title Consistency',
  },
} as const

const UI_TEXT = {
  zh: {
    kicker: 'Diagnostic Console',
    title: '检查结果',
    totalRecords: '共',
    totalRecordsSuffix: '条问题记录',
    totalIssues: '总问题数',
    critical: '严重问题',
    major: '中等问题',
    minor: '轻微问题',
    pendingSuffix: '条待处理项',
    collapse: '收起',
    expand: '展开',
  },
  en: {
    kicker: 'Diagnostic Console',
    title: 'Inspection Results',
    totalRecords: '',
    totalRecordsSuffix: 'records',
    totalIssues: 'Total Issues',
    critical: 'Critical',
    major: 'Major',
    minor: 'Minor',
    pendingSuffix: 'items to review',
    collapse: 'Collapse',
    expand: 'Expand',
  },
} as const

const CATEGORY_ORDER = ['layout', 'typography', 'heading', 'figure', 'spelling', 'terminology', 'consistency']

export function DiagnosticPanel({ issues, language = 'zh' }: DiagnosticPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER))
  const lang = language === 'en' ? 'en' : 'zh'
  const t = UI_TEXT[lang]
  const labels = CATEGORY_LABELS[lang]

  if (issues.length === 0) {
    return <EmptyState language={language} />
  }

  const groupedIssues = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = issues.filter(i => i.category === cat)
    return acc
  }, {} as Record<string, Issue[]>)

  const toggleCategory = (cat: string) => {
    const newSet = new Set(expandedCategories)
    if (newSet.has(cat)) {
      newSet.delete(cat)
    } else {
      newSet.add(cat)
    }
    setExpandedCategories(newSet)
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const majorCount = issues.filter(i => i.severity === 'major').length
  const minorCount = issues.filter(i => i.severity === 'minor').length

  return (
    <div className="diagnostic-shell">
      <div className="section-header-block compact border-b border-[rgba(185,199,216,0.12)] pb-4">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h2 className="section-title">{t.title}</h2>
        </div>
        <span className="info-chip inline-flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          {lang === 'zh' ? `${t.totalRecords} ${issues.length} ${t.totalRecordsSuffix}` : `${issues.length} ${t.totalRecordsSuffix}`}
        </span>
      </div>

      <div className="diagnostic-summary">
        <div className="summary-grid">
          <div className="summary-card summary-card-total">
            <div className="summary-value">{issues.length}</div>
            <div className="summary-label">{t.totalIssues}</div>
          </div>
          <div className="summary-card summary-card-critical">
            <div className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="summary-value">{criticalCount}</span>
            </div>
            <div className="summary-label">{t.critical}</div>
          </div>
          <div className="summary-card summary-card-major">
            <div className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="summary-value">{majorCount}</span>
            </div>
            <div className="summary-label">{t.major}</div>
          </div>
          <div className="summary-card summary-card-minor">
            <div className="inline-flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="summary-value">{minorCount}</span>
            </div>
            <div className="summary-label">{t.minor}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-[rgba(185,199,216,0.12)]">
        {CATEGORY_ORDER.map(cat => {
          const categoryIssues = groupedIssues[cat]
          if (!categoryIssues || categoryIssues.length === 0) return null

          const isExpanded = expandedCategories.has(cat)

          return (
            <div key={cat} className="category-block">
              <button onClick={() => toggleCategory(cat)} className="category-toggle" type="button">
                <div className="category-toggle-left">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#92a8c2]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#92a8c2]" />
                  )}
                  <div>
                    <div className="category-title">{labels[cat as keyof typeof labels]}</div>
                    <div className="category-count">{categoryIssues.length} {t.pendingSuffix}</div>
                  </div>
                </div>
                <span className="info-chip">{isExpanded ? t.collapse : t.expand}</span>
              </button>

              {isExpanded && (
                <div className="issue-list">
                  {categoryIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
