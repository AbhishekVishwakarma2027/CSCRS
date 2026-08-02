import { Info, MapPin, ArrowRightLeft, Wrench, ShieldCheck } from 'lucide-react'

export function WhoWeAre() {
  return (
    <section id="about" className="border-neutral-150 border-b bg-transparent py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Column: Context Branding */}
          <div className="space-y-6">
            <div className="bg-primary/5 text-primary inline-flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Info className="h-3.5 w-3.5" />
              <span>Introduction</span>
            </div>
            <h2 className="text-neutral-850 text-3xl font-black tracking-tight">Who We Are</h2>
            <div className="bg-primary h-1 w-12 rounded" />

            <div className="max-w-xl space-y-4 text-sm leading-relaxed font-semibold text-neutral-600 md:text-base">
              <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-base font-extrabold text-neutral-800 md:text-lg">
                  National Governance Framework
                </p>
                <p className="text-neutral-650 text-justify font-medium">
                  The Crowdsourced Civic Issue Reporting & Resolution System (CSCRS) provides a
                  unified digital channel for citizens to collaborate with local municipalities.
                  Designed under national e-governance standards, our framework integrates directly
                  with central departments, urban local bodies (ULBs), and civic development
                  authorities to streamline grievance redressal.
                </p>
                <p className="text-neutral-650 text-justify font-medium">
                  By bridging the gap between public feedback and municipal execution, CSCRS
                  dynamically routes reports to field workers, supervisors, and administrative
                  officers. This ensures real-time progress tracking, transparent Service Level
                  Agreements (SLAs), and data-driven infrastructure planning for modern cities.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Workflow Diagram */}
          <div className="flex w-full flex-col space-y-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
            <h3 className="border-b border-neutral-200 pb-3 text-sm font-black tracking-wider text-neutral-800 uppercase">
              Platform Workflow Schema
            </h3>

            <div className="relative space-y-6">
              {/* Vertical connecting line */}
              <div className="absolute top-2 bottom-2 left-5 w-0.5 bg-neutral-200" />

              {/* Step 1 */}
              <div className="relative flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A3C7D] text-sm font-bold text-white shadow-md">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-neutral-800">1. Citizen Reporting</p>
                  <p className="text-xs leading-relaxed font-semibold text-neutral-500">
                    Citizen uploads the civic issue with precise GPS coordinates and photo evidence
                    via the mobile app or web portal.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-sm font-bold text-white shadow-md">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-neutral-800">2. Automated Routing</p>
                  <p className="text-xs leading-relaxed font-semibold text-neutral-500">
                    The system categorizes and dynamically dispatches the issue to the respective
                    municipal department and field officer.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D97706] text-sm font-bold text-white shadow-md">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-neutral-800">3. Field Resolution</p>
                  <p className="text-xs leading-relaxed font-semibold text-neutral-500">
                    Assigned field teams address the issue on-site, upload confirmation photos, and
                    submit status updates.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-sm font-bold text-white shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-neutral-800">4. Verification & Audit</p>
                  <p className="text-xs leading-relaxed font-semibold text-neutral-500">
                    Supervisor reviews work, and the citizen receives a notification to confirm
                    resolution and rate their experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
