import { Cpu, MapPin, Clock, ShieldAlert, Copy, BarChart3 } from 'lucide-react'

interface FeatureItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accentColor: string
}

const PLATFORM_FEATURES: FeatureItem[] = [
  {
    title: 'AI Classification',
    description:
      'Incoming civic issues are analyzed using deep computer vision models to classify categories and recommend department routing.',
    icon: Cpu,
    accentColor: 'text-[#0A3C7D] bg-blue-50/50',
  },
  {
    title: 'Geo Verification',
    description:
      'Reports require active device GPS validation to check jurisdictional boundaries and verify field completions.',
    icon: MapPin,
    accentColor: 'text-[#0D9488] bg-teal-50/50',
  },
  {
    title: 'SLA Monitoring',
    description:
      'Automatic alerts escalate tickets to central admin boards when department response parameters breach targets.',
    icon: Clock,
    accentColor: 'text-amber-600 bg-amber-50/50',
  },
  {
    title: 'Fraud Detection',
    description:
      'Upload filters check EXIF tags, image duplicates, and camera spoofing vectors to keep data trails trustworthy.',
    icon: ShieldAlert,
    accentColor: 'text-rose-600 bg-rose-50/50',
  },
  {
    title: 'Duplicate Detection',
    description:
      'Clustering algorithms identify nearby reports of the same incident, grouping them into single target work orders.',
    icon: Copy,
    accentColor: 'text-violet-600 bg-violet-50/50',
  },
  {
    title: 'Operations Analytics',
    description:
      'Dynamic charts track division completion rates, resolution speeds, and budget allocations for municipal decision-makers.',
    icon: BarChart3,
    accentColor: 'text-sky-600 bg-sky-50/50',
  },
]

export function PlatformFeatures() {
  return (
    <section
      id="features"
      className="border-neutral-150 border-b bg-transparent py-16 select-none md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-xs font-extrabold tracking-widest text-[#0A3C7D] uppercase">
            Security & Audits
          </h2>
          <p className="text-neutral-855 mt-1 text-3xl font-black">Platform Capabilities</p>
          <div className="mx-auto mt-3 h-1 w-12 rounded bg-[#0A3C7D]" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon

            return (
              <div
                key={idx}
                className="group flex cursor-default flex-col justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div
                    className={`w-fit rounded-xl border border-neutral-200/80 p-3 shadow-sm transition-transform duration-300 group-hover:scale-105 ${feature.accentColor}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="text-neutral-850 text-base font-bold tracking-tight transition-colors group-hover:text-[#0A3C7D]">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed font-medium text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
