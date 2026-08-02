import { CheckCircle2, Building2, Users2, ShieldAlert } from 'lucide-react'
import { useCountUp } from '@/hooks/use-count-up'

export function Statistics() {
  const issuesCount = useCountUp(124500, 2000)
  const deptsCount = useCountUp(18, 1500)
  const workersCount = useCountUp(3200, 1800)
  const citiesCount = useCountUp(5, 1000)

  return (
    <section
      id="statistics"
      className="border-neutral-250/60 border-b bg-neutral-50/50 py-12 select-none"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="text-primary text-xs font-extrabold tracking-widest uppercase">
            Platform Snapshot
          </h2>
          <p className="mt-1 text-2xl font-black text-neutral-800">System Operations Metrics</p>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {/* Card 1: Resolved Issues */}
          <div className="group flex items-center space-x-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-neutral-850 text-2xl font-black">
                {issuesCount.toLocaleString()}+
              </p>
              <p className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                Reports Resolved
              </p>
            </div>
          </div>

          {/* Card 2: Registered Departments */}
          <div className="group flex items-center space-x-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-transform duration-300 group-hover:scale-105">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-neutral-855 text-2xl font-black">{deptsCount}</p>
              <p className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                Departments
              </p>
            </div>
          </div>

          {/* Card 3: Active Workers */}
          <div className="group flex items-center space-x-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 transition-transform duration-300 group-hover:scale-105">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-neutral-850 text-2xl font-black">
                {workersCount.toLocaleString()}+
              </p>
              <p className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                Active Workers
              </p>
            </div>
          </div>

          {/* Card 4: Cities / Jurisdictions */}
          <div className="group flex items-center space-x-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition-transform duration-300 group-hover:scale-105">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-neutral-850 text-2xl font-black">{citiesCount}</p>
              <p className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                Covered Cities
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
