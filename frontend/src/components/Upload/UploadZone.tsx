import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

interface UploadZoneProps {
  onFileSelected: (file: File) => void
  onTemplateSelected?: (file: File) => void
  disabled?: boolean
  templateDisabled?: boolean
  templateName?: string
}

export function UploadZone({
  onFileSelected,
  onTemplateSelected,
  disabled,
  templateDisabled,
  templateName,
}: UploadZoneProps) {
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600">
          {isDragActive ? '释放文件以上传' : '拖拽 .docx 文件到这里，或点击选择'}
        </p>
        <p className="text-sm text-gray-400 mt-2">支持 .docx 格式，最大 20MB</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">上传参考模板</h3>
            <p className="text-sm text-gray-500">可上传 .dotx / .dot / .docx / .doc 作为检查基准</p>
          </div>
          {templateName && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
              已启用：{templateName}
            </span>
          )}
        </div>

        <div
          {...getTemplateRootProps()}
          className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isTemplateDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            ${(templateDisabled || !onTemplateSelected) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getTemplateInputProps()} />
          <p className="text-sm text-gray-600">
            {isTemplateDragActive ? '释放模板文件以上传' : '点击或拖拽上传参考模板'}
          </p>
          <p className="mt-1 text-xs text-gray-400">支持 .dotx / .dot / .docx / .doc</p>
        </div>
      </div>
    </div>
  )
}
