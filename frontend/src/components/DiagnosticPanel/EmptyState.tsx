interface EmptyStateProps {
  language?: string
}

export function EmptyState({ language = 'zh' }: EmptyStateProps) {
  const isZh = language === 'zh'

  return (
    <div className="empty-shell">
      <div className="mx-auto empty-badge">OK</div>
      <h3 className="empty-title">{isZh ? '本次审校未发现需处理问题' : 'No Actionable Issues Found'}</h3>
      <p className="empty-description mx-auto mt-3 max-w-2xl">
        {isZh
          ? '文档已通过当前质量标准，可直接进入报告导出或归档流程。'
          : 'The document passes the current quality standards and is ready for export or archive.'}
      </p>
    </div>
  )
}
