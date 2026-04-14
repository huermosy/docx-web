import { useState, useCallback, useRef } from 'react'
import { qcApi, Issue } from '../api/qcApi'

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export function useQCAnalysis() {
  const [state, setState] = useState<AnalysisState>('idle')
  const [issues, setIssues] = useState<Issue[]>([])
  const [error, setError] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [llmAvailable, setLlmAvailable] = useState<boolean>(true)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }

  const poll = async (tid: string) => {
    try {
      const { data: status } = await qcApi.getStatus(tid)

      if (status.status === 'rule_complete') {
        const { data: ruleData } = await qcApi.getResult(tid)
        setIssues(ruleData.issues)
        setLlmAvailable(ruleData.llm_available)
        pollingRef.current = setTimeout(() => poll(tid), 2000)
      } else if (status.status === 'llm_running') {
        pollingRef.current = setTimeout(() => poll(tid), 2000)
      } else if (status.status === 'done') {
        const { data: finalData } = await qcApi.getResult(tid)
        setIssues(finalData.issues)
        setLlmAvailable(finalData.llm_available)
        setState('done')
        stopPolling()
      } else if (status.status === 'failed') {
        setError(status.message || 'Analysis failed')
        setState('error')
        stopPolling()
      } else {
        pollingRef.current = setTimeout(() => poll(tid), 2000)
      }
    } catch (err) {
      setError('Failed to get analysis status')
      setState('error')
      stopPolling()
    }
  }

  const analyze = useCallback(async (file: File, hasTemplate = false) => {
    setState('uploading')
    setError('')
    setIssues([])
    setLlmAvailable(true)

    try {
      const { data: uploadData } = await qcApi.upload(file)
      setState('analyzing')

      const { data: analyzeData } = await qcApi.analyze(uploadData.file_id, hasTemplate)
      setTaskId(analyzeData.task_id)
      poll(analyzeData.task_id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
      setState('error')
    }
  }, [])

  return {
    state,
    issues,
    error,
    taskId,
    llmAvailable,
    analyze,
  }
}
