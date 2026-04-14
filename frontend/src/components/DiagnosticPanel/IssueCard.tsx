import { Issue } from '../../api/qcApi'
import { AlertTriangle, AlertCircle, Info, Lightbulb } from 'lucide-react'

interface IssueCardProps {
  issue: Issue
}

const SEVERITY_CONFIG = {
  critical: {
    color: 'border-red-500 bg-red-50',
    textColor: 'text-red-700',
    icon: AlertTriangle,
    label: '严重',
  },
  major: {
    color: 'border-yellow-500 bg-yellow-50',
    textColor: 'text-yellow-700',
    icon: AlertCircle,
    label: '中等',
  },
  minor: {
    color: 'border-blue-500 bg-blue-50',
    textColor: 'text-blue-700',
    icon: Info,
    label: '轻微',
  },
}

export function IssueCard({ issue }: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity]
  const Icon = config.icon

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.textColor} bg-white`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {issue.source === 'llm' ? 'LLM' : issue.source === 'merged' ? '合并' : '规则'}
            </span>
          </div>

          <p className="text-gray-800 mb-2">{issue.description}</p>

          <div className="text-sm text-gray-600">
            <span>位置: </span>
            <span>{issue.position.section || '未知章节'}</span>
            {issue.position.paragraph > 0 && (
              <span> - 段落 {issue.position.paragraph}</span>
            )}
          </div>

          {issue.fixSuggestion && (
            <div className="mt-2 flex items-start gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-gray-700">{issue.fixSuggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
