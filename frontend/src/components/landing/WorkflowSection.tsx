import {
  User,
  Cpu,
  Building,
  Wrench,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepItem {
  number: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
}

const WORKFLOW_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Citizen Reporting',
    description: 'Issue logged via App with photo & GPS coords.',
    icon: User,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    number: '02',
    title: 'AI Verification',
    description: 'Image & EXIF metadata verified, routed to dept.',
    icon: Cpu,
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    number: '03',
    title: 'Dept Assignment',
    description: 'Admin confirms ticket & forwards to field worker.',
    icon: Building,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    number: '04',
    title: 'Worker Resolution',
    description: 'Worker executes resolution & uploads geo-tagged proof.',
    icon: Wrench,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    number: '05',
    title: 'Validation',
    description: 'Department Admin verifies resolution validity.',
    icon: CheckSquare,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
  {
    number: '06',
    title: 'Completed',
    description: 'Ticket closed. SLA logged & metrics updated.',
    icon: ShieldCheck,
    bgColor: 'bg-neutral-50',
    textColor: 'text-neutral-600',
  },
]

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="border-neutral-150 border-b bg-neutral-50/40 py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-primary text-xs font-extrabold tracking-widest uppercase">
            SOP Guidelines
          </h2>
          <p className="text-neutral-850 mt-1 text-3xl font-black">How CSCRS Works</p>
          <div className="bg-primary mx-auto mt-3 h-1 w-12 rounded" />
        </div>

        {/* Responsive flowchart grid */}
        <div className="mb-16 flex flex-col items-center justify-between gap-2 lg:flex-row lg:gap-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const IconComponent = step.icon
            const isLast = index === WORKFLOW_STEPS.length - 1

            return (
              <div key={index} className="flex w-full flex-col items-center lg:flex-1 lg:flex-row">
                {/* Step Card */}
                <div className="group w-full max-w-[280px] cursor-default space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:border-neutral-300 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">
                      Step {step.number}
                    </span>
                    <div
                      className={`rounded-lg p-2 ${step.bgColor} ${step.textColor} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="group-hover:text-primary text-sm font-bold tracking-tight text-neutral-800 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[11px] leading-normal text-neutral-500">{step.description}</p>
                </div>

                {/* Arrow Connector */}
                {!isLast && (
                  <div className="flex items-center justify-center py-4 lg:flex-1 lg:px-2 lg:py-0">
                    {/* Arrow right on desktop, arrow down on mobile */}
                    <ArrowRight className="hidden h-6 w-6 shrink-0 animate-pulse text-[#0A3C7D] lg:block" />
                    <ArrowDown className="h-6 w-6 shrink-0 animate-pulse text-[#0A3C7D] lg:hidden" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* SOP Buttons Below Flowchart */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            variant="outline"
            className="border-neutral-250 flex w-full items-center space-x-2 px-6 py-5 text-xs font-bold tracking-tight shadow-sm hover:bg-neutral-50 sm:w-auto"
          >
            <BookOpen className="h-4 w-4 text-neutral-500" />
            <span>View Citizen Guide</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            className="border-neutral-250 flex w-full items-center space-x-2 px-6 py-5 text-xs font-bold tracking-tight shadow-sm hover:bg-neutral-50 sm:w-auto"
          >
            <BookOpen className="h-4 w-4 text-neutral-500" />
            <span>View Administrative SOP</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
