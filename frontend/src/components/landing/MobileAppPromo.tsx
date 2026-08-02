import { Smartphone, QrCode } from 'lucide-react'

export function MobileAppPromo() {
  return (
    <section className="border-neutral-150 border-b bg-transparent py-16 select-none md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="mb-1.5 text-xs font-extrabold tracking-widest text-[#0A3C7D] uppercase">
            GET STARTED WITH
          </h2>
          <p className="text-neutral-855 text-3xl font-black">Download the CSCRS Citizen App</p>
          <div className="mx-auto mt-3 h-1 w-12 rounded bg-[#0A3C7D]" />
        </div>

        {/* Promo Banner Container (Dark blue theme, premium spacing, 16px corner radius) */}
        <div className="via-slate-955 to-slate-955 border-neutral-850 overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 p-8 shadow-xl md:p-12 lg:p-14">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Side: App details and CTA download */}
            <div className="space-y-6 text-center text-white lg:col-span-7 lg:text-left">
              <span className="inline-block rounded bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase backdrop-blur">
                Companion Service Utility
              </span>
              <h3 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">
                Submit and Track Issues on Android and iOS
              </h3>
              <p className="mx-auto max-w-xl text-xs leading-relaxed font-medium text-neutral-400 md:text-sm lg:mx-0">
                The companion mobile application provides quick reporting capabilities. Citizens can
                capture real-time geocoded photos, submit issues to municipal offices, and track
                completion progress with automated push notifications.
              </p>

              {/* Badges & QR Layout Block */}
              <div className="flex flex-col items-center justify-center gap-6 pt-4 sm:flex-row lg:justify-start">
                {/* QR Code Casing with clean spacing */}
                <div className="flex items-center justify-center rounded-xl border border-neutral-800 bg-white p-2.5 shadow-md transition-transform duration-300 hover:scale-102">
                  <div className="flex flex-col items-center">
                    <QrCode className="h-14 w-14 text-neutral-900" />
                    <span className="mt-1.5 text-[9.5px] font-black tracking-wider text-[#0A3C7D] uppercase">
                      Scan to Get App
                    </span>
                  </div>
                </div>

                <div className="hidden h-12 w-px bg-neutral-800 sm:block" />

                {/* App Download Stores placeholders (well-aligned) */}
                <div className="flex flex-col gap-2.5">
                  <div className="bg-neutral-850 flex w-44 cursor-pointer items-center justify-center space-x-3 rounded-xl border border-neutral-800 px-4 py-2 shadow transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800/80">
                    <span className="text-xs font-bold tracking-tight">Get it on Google Play</span>
                  </div>
                  <div className="bg-neutral-850 flex w-44 cursor-pointer items-center justify-center space-x-3 rounded-xl border border-neutral-800 px-4 py-2 shadow transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800/80">
                    <span className="text-xs font-bold tracking-tight">Download App Store</span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="flex items-center justify-center space-x-2 pt-2 text-xs text-neutral-500 lg:justify-start">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                <span className="text-[9px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Beta Version Live for Local Audit
                </span>
              </div>
            </div>

            {/* Right Side: Realistic Phone Mockup */}
            <div className="flex justify-center lg:col-span-5">
              {/* Premium smartphone frame proportions (thin bezel, smooth corner radius) */}
              <div className="relative flex h-[492px] w-[246px] flex-col justify-between overflow-hidden rounded-[38px] border-[8px] border-neutral-800 bg-neutral-950 p-2.5 shadow-xl shadow-black/25 transition-transform duration-500 select-none hover:scale-[1.02]">
                {/* Speaker slit notch */}
                <div className="absolute top-1.5 left-1/2 z-30 flex h-3.5 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-neutral-900">
                  <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-900" />
                  <div className="bg-neutral-850 h-0.5 w-6 rounded" />
                </div>

                {/* Mock Application Screen Content */}
                <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[30px] border border-neutral-900 bg-neutral-950 p-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-1 text-[7px] font-bold text-neutral-600">
                    <span>CSCRS App</span>
                    <span>10:42 AM</span>
                  </div>

                  {/* App Dashboard Preview */}
                  <div className="my-4 flex flex-grow flex-col items-center justify-center space-y-3.5 text-center">
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold tracking-tight text-white">
                        Grievance Dashboard
                      </p>
                      <p className="text-neutral-550 text-[8px] leading-normal">
                        Submit geocoded tickets to municipal administrators.
                      </p>
                    </div>
                    {/* Simulated button */}
                    <div className="w-full cursor-pointer rounded-lg bg-emerald-500 py-1.5 text-[8px] font-bold text-neutral-950 shadow transition-colors hover:bg-emerald-400">
                      File New Report
                    </div>
                  </div>

                  {/* App Bottom Navigation */}
                  <div className="flex items-center justify-around border-t border-neutral-900 pt-1.5 text-[7px] font-bold text-neutral-600 uppercase">
                    <span className="text-white">Home</span>
                    <span>Reports</span>
                    <span>Settings</span>
                  </div>

                  {/* "Coming Soon" Overlay */}
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-neutral-950/85 p-4 text-center backdrop-blur-[2.5px]">
                    <span className="mb-2 rounded bg-emerald-500 px-2 py-0.5 text-[8px] font-bold tracking-wider text-neutral-950 uppercase">
                      Coming Soon
                    </span>
                    <p className="text-[11px] font-black tracking-tight text-white">Citizen App</p>
                    <p className="mt-1 max-w-[130px] text-[8px] leading-relaxed text-neutral-500">
                      Launching next phase on Android & iOS devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
