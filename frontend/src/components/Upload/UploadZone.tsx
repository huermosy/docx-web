import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileUp, Layers3 } from 'lucide-react'

interface UploadZoneProps {
  onFileSelected: (file: File) => void
  onTemplateSelected?: (file: File) => void
  disabled?: boolean
  templateDisabled?: boolean
  templateName?: string
  language?: 'zh' | 'en'
}

const COPY = {
  zh: {
    primaryLabel: 'Primary Intake',
    titleIdle: '上传待检文档',
    titleDrag: '释放后开始进入质检流程',
    description: '将正式文档送入工作台，系统会围绕结构、版式、语言与一致性维度生成诊断结果。',
    docxOnly: '仅支持 .docx',
    suggested: '建议正式送审文稿',
    selectDocument: '选择文档',
    dragDocument: '拖拽到此直接上传',
    enhancedLabel: 'Enhanced Mode',
    enhancedTitle: '上传参考模板',
    enhancedDescription: '用于提高版式、一致性与结构对照的检查精度，适合需要贴近单位模板规范的文档。',
    enabled: '已启用：',
    templateDrag: '释放模板文件以上传',
    templateIdle: '点击或拖拽上传参考模板（.dotx / .dot / .docx / .doc）',
  },
  en: {
    primaryLabel: 'Primary Intake',
    titleIdle: 'Upload the document for inspection',
    titleDrag: 'Release to start the inspection flow',
    description: 'Send a formal document into the workspace and receive findings across structure, formatting, language, and consistency.',
    docxOnly: 'Only .docx supported',
    suggested: 'Recommended for formal review drafts',
    selectDocument: 'Choose Document',
    dragDocument: 'Drag a file here to upload',
    enhancedLabel: 'Enhanced Mode',
    enhancedTitle: 'Upload a Reference Template',
    enhancedDescription: 'Improves layout, consistency, and structure comparison for documents that must follow a template standard.',
    enabled: 'Enabled: ',
    templateDrag: 'Release the template to upload',
    templateIdle: 'Click or drag to upload a reference template (.dotx / .dot / .docx / .doc)',
  },
} as const

export function UploadZone({
  onFileSelected,
  onTemplateSelected,
  disabled,
  templateDisabled,
  templateName,
  language = 'zh',
}: UploadZoneProps) {
  const t = COPY[language]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0])
    }
  }, [onFileSelected])

  const onTemplateDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && onTemplateSelected) {
      onTemplateSelected(acceptedFiles[0])
    }
  }, [onTemplateSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    disabled,
  })

  const {
    getRootProps: getTemplateRootProps,
    getInputProps: getTemplateInputProps,
    isDragActive: isTemplateDragActive,
  } = useDropzone({
    onDrop: onTemplateDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template': ['.dotx'],
      'application/vnd.ms-word.template.macroEnabled.12': ['.dot'],
    },
    multiple: false,
    disabled: templateDisabled || !onTemplateSelected,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={[
          'upload-shell transition-all duration-200',
          isDragActive ? 'upload-shell-active' : '',
          disabled ? 'upload-shell-disabled' : 'upload-shell-enabled',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="upload-shell-inner">
          <div className="upload-orb">
            <Upload className="h-8 w-8" />
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="upload-label">{t.primaryLabel}</p>
              <h3 className="upload-title">{isDragActive ? t.titleDrag : t.titleIdle}</h3>
              <p className="upload-description">{t.description}</p>
            </div>
            <div className="section-badge-row">
              <span className="info-chip">{t.docxOnly}</span>
              <span className="info-chip">{t.suggested}</span>
            </div>
          </div>

          <div className="upload-cta-row">
            <div className="upload-cta upload-cta-primary">{t.selectDocument}</div>
            <div className="upload-cta upload-cta-secondary">{t.dragDocument}</div>
          </div>
        </div>
      </div>

      <div className="template-shell transition-all duration-200 hover:border-[rgba(126,227,196,0.28)]">
        <div className="template-header">
          <div>
            <p className="upload-label">{t.enhancedLabel}</p>
            <h3 className="template-title mt-2 text-lg font-semibold">{t.enhancedTitle}</h3>
            <p className="template-description mt-2 text-sm">{t.enhancedDescription}</p>
          </div>
          {templateName && <span className="template-badge">{t.enabled}{templateName}</span>}
        </div>

        <div
          {...getTemplateRootProps()}
          className={[
            'template-dropzone transition-all duration-200',
            isTemplateDragActive ? 'template-dropzone-active' : '',
            templateDisabled || !onTemplateSelected ? 'template-shell-disabled' : 'template-shell-enabled',
          ].join(' ')}
        >
          <input {...getTemplateInputProps()} />
          <Layers3 className="h-4 w-4 text-emerald-200" />
          <FileUp className="h-4 w-4 text-emerald-200" />
          <span>{isTemplateDragActive ? t.templateDrag : t.templateIdle}</span>
        </div>
      </div>
    </div>
  )
}
