import { formatConfidence } from '@/utils/format'
import { useAITelemetryQuery, useExportAIDatasetMutation } from '../hooks/use-super-admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cpu, CheckCircle2, AlertTriangle, Layers, Clock, Zap, Download } from 'lucide-react'
import { toast } from 'sonner'

export function AITelemetryCard() {
  const { data, isLoading, error } = useAITelemetryQuery()
  const exportAIDatasetMutation = useExportAIDatasetMutation()

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await exportAIDatasetMutation.mutateAsync(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai_dataset.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`AI Dataset exported successfully as ${format.toUpperCase()}.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to export AI dataset.')
    }
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse p-6">
        <div className="h-6 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="dark:bg-neutral-850 h-24 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border border-neutral-200 p-6 text-center text-sm font-bold text-neutral-500 dark:border-neutral-800">
        AI Telemetry metrics unavailable.
      </Card>
    )
  }

  return (
    <Card className="border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
            AI Model & Verification Telemetry
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 hidden items-center gap-1.5 text-xs font-bold text-neutral-500 sm:flex">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Active Models: {data.distinct_model_versions?.join(', ') || 'N/A'}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={exportAIDatasetMutation.isPending}
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1 text-xs font-bold dark:border-neutral-800"
          >
            <Download className="h-3 w-3" />
            Dataset CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={exportAIDatasetMutation.isPending}
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1 text-xs font-bold dark:border-neutral-800"
          >
            <Download className="h-3 w-3" />
            Dataset XLSX
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Verification Count */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-indigo-50/30 p-4 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>AI Verifications</span>
            <Zap className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
            {data.total_ai_verifications}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Total automated checks</p>
        </div>

        {/* Average Confidence */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-emerald-50/30 p-4 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Avg Confidence</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {formatConfidence(data.average_confidence)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Classification accuracy</p>
        </div>

        {/* Inference Latency */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-blue-50/30 p-4 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Inference Latency</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-black text-neutral-900 dark:text-white">
            {data.average_inference_time_ms.toFixed(0)} ms
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Average model duration</p>
        </div>

        {/* Resolution AI Stats */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-purple-50/30 p-4 dark:bg-purple-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>Resolution Auto-Approve</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-3xl font-black text-purple-600">
            {data.resolution_ai_approved} / {data.resolution_ai_total}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">
            {data.resolution_ai_manual_review} manual reviews required
          </p>
        </div>
      </div>
    </Card>
  )
}
