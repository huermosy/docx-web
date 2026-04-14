interface EmptyStateProps {
  language?: string
}

export function EmptyState({ language = 'zh' }: EmptyStateProps) {
  const isZh = language === 'zh'

  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="text-6xl mb-4">OK</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isZh ? '文档质量良好' : 'Document Quality is Good'}
      </h3>
      <p className="text-gray-600">
        {isZh
          ? '未发现格式或内容问题，文档符合质量标准。'
          : 'No format or content issues found. The document meets quality standards.'}
      </p>
    </div>
  )
}
