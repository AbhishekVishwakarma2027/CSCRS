import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  title?: string
}

interface State {
  hasError: boolean
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Widget crash caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-250 flex min-h-[220px] flex-col items-center justify-center gap-2.5 border bg-red-50/10 p-5 text-center dark:border-red-950/20 dark:bg-red-950/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black tracking-widest text-rose-800 uppercase dark:text-rose-400">
              {this.props.title || 'Telemetry Timeout'}
            </h4>
            <p className="text-neutral-450 max-w-[200px] text-[11px] leading-relaxed font-semibold dark:text-neutral-500">
              An unexpected rendering error occurred inside this telemetry module.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="dark:border-neutral-750 mt-1 cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-black text-red-700 shadow-xs transition-colors outline-none hover:bg-red-50 focus:ring-2 focus:ring-red-500 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Reset Module
          </button>
        </Card>
      )
    }

    return this.props.children
  }
}
export default WidgetErrorBoundary
