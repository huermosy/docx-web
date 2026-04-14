import { useState } from 'react'
import { Issue } from '../../api/qcApi'
import { IssueCard } from './IssueCard'
import { EmptyState } from './EmptyState'
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface DiagnosticPanelProps {
  issues: Issue[]
  language?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  layout: '页面布局',
  typography: '字体段落',
  heading: '标题结构',
  figure: '图表与引用',
  spelling: '拼写与语法',
  terminology: '术语统一性',
  consistency: '标题一致性',
}

const CATEGORY_ORDER = ['layout', 'typography', 'heading', 'figure', 'spelling', 'terminology', 'consistency']

export function DiagnosticPanel({ issues, language = 'zh' }: DiagnosticPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER))

  if (issues.length === 0) {
    return <EmptyState language={language} />
  }

  // 按类别分组
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

  // 统计
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const majorCount = issues.filter(i => i.severity === 'major').length
  const minorCount = issues.filter(i => i.severity === 'minor').length

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 统计概览 */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">检查结果</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">{criticalCount} 严重</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{majorCount} 中等</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Info className="h-4 w-4" />
            <span className="font-medium">{minorCount} 轻微</span>
          </div>
        </div>
      </div>

      {/* 问题列表 */}
      <div className="divide-y">
        {CATEGORY_ORDER.map(cat => {
          const categoryIssues = groupedIssues[cat]
          if (!categoryIssues || categoryIssues.length === 0) return null

          const isExpanded = expandedCategories.has(cat)

          return (
            <div key={cat} className="p-4">
              <button
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-2 w-full text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium">{CATEGORY_LABELS[cat]}</span>
                <span className="text-gray-500">({categoryIssues.length})</span>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-3 pl-6">
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
