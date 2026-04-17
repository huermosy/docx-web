import { Issue } from '../../api/qcApi'
import { AlertTriangle, AlertCircle, Info, Lightbulb, MapPin } from 'lucide-react'

interface IssueCardProps {
  issue: Issue
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    label: '严重',
    textColor: 'issue-severity-critical',
    cardClass: 'issue-card-critical',
  },
  major: {
    icon: AlertCircle,
    label: '中等',
    textColor: 'issue-severity-major',
    cardClass: 'issue-card-major',
  },
  minor: {
    icon: Info,
    label: '轻微',
    textColor: 'issue-severity-minor',
    cardClass: 'issue-card-minor',
  },
}

export function IssueCard({ issue }: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity]
  const Icon = config.icon
  const sourceLabel = issue.source === 'llm' ? 'LLM' : issue.source === 'merged' ? '合并' : '规则'

  return (
    <div className={`issue-card ${config.cardClass}`}>
      <div className="issue-header">
        <div className="issue-icon-wrap">
          <Icon className={`h-4 w-4 ${config.textColor}`} />
        </div>
        <div className="flex-1">
          <div className="issue-badge-row">
            <span className={`issue-meta-chip ${config.textColor}`}>{config.label}</span>
            <span className="issue-source-chip">来源：{sourceLabel}</span>
            <span className="issue-meta-chip">类别：{issue.category}</span>
          </div>

          <p className="issue-title">{issue.description}</p>

          <div className="issue-meta-row">
            <span className="issue-location inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{issue.position.section || '未知章节'}</span>
              {issue.position.paragraph > 0 && <span>· 段落 {issue.position.paragraph}</span>}
            </span>
          </div>

          {issue.fixSuggestion && (
            <div className="issue-suggestion">
              <Lightbulb className="mt-0.5 h-4 w-4 text-emerald-300" />
              <div>
                <div className="text-sm text-emerald-100">建议修复</div>
                <div className="mt-1 text-sm text-[#d7e7df]">{issue.fixSuggestion}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
