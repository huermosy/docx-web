import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export interface UploadResponse {
  success: boolean
  file_id: string
  filename: string
}

export interface TemplateUploadResponse {
  success: boolean
  template_id: string
  filename: string
}

export interface AnalyzeStatus {
  task_id: string
  status: 'pending' | 'parsing' | 'rule_complete' | 'llm_running' | 'done' | 'failed'
  progress: number
  message: string
  created_at: string
  updated_at: string
}

export interface AnalyzeResult {
  task_id: string
  status: string
  issues: Issue[]
  llm_available: boolean
}

export interface Issue {
  id: string
  position: {
    section: string
    paragraph: number
    line: number
    xpath: string
  }
  category: 'layout' | 'typography' | 'heading' | 'figure' | 'spelling' | 'terminology' | 'consistency'
  severity: 'critical' | 'major' | 'minor'
  description: string
  fixSuggestion: string
  source: 'rule' | 'llm' | 'merged'
  confidence: number
  templateRelated: boolean
}

export interface StandardCategory {
  title: string
  items: string[]
}

export interface RulesSummary {
  body_font_size_min: number
  body_font_size_max: number
  heading_font_sizes: Record<string, number>
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  first_line_indent: number
}

export interface ConfigResponse {
  llm_api_base: string
  llm_model: number | string
  timeout_seconds: number
  chinese_check_by_llm: boolean
  max_file_size_mb: number
  allowed_extensions: string[]
  rules: RulesSummary
  standards: Record<string, StandardCategory>
}

export const qcApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<UploadResponse>('/upload', formData)
  },

  uploadTemplate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<TemplateUploadResponse>('/upload/template', formData)
  },

  analyze: (fileId: string, hasTemplate = false) => {
    return api.post<{ task_id: string }>('/analyze', { file_id: fileId, has_template: hasTemplate })
  },

  getStatus: (taskId: string) => {
    return api.get<AnalyzeStatus>(`/analyze/${taskId}/status`)
  },

  getResult: (taskId: string) => {
    return api.get<AnalyzeResult>(`/analyze/${taskId}/result`)
  },

  getConfig: () => {
    return api.get<ConfigResponse>('/config')
  },

  updateConfig: (data: Partial<ConfigResponse>) => {
    return api.put('/config', data)
  },

  downloadReport: (taskId: string, format: 'pdf' | 'docx') => {
    return api.get(`/report/${taskId}/${format}`, { responseType: 'blob' })
  },
}
