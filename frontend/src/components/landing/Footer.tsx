import { APP_CONFIG } from '@/config/app.config'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      id="sitemap"
      className="border-t border-neutral-800 bg-neutral-950 py-16 font-sans text-neutral-400 select-none"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Column 1: Sitemap Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-white uppercase">Sitemap</h3>
            <ul className="space-y-3 text-xs font-semibold">
              <li>
                <a href="#home" className="transition-colors duration-200 hover:text-white">
                  Home (Top Portal)
                </a>
              </li>
              <li>
                <a href="#about" className="transition-colors duration-200 hover:text-white">
                  About Infrastructure
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="transition-colors duration-200 hover:text-white">
                  System Workflow (SOP)
                </a>
              </li>
              <li>
                <a href="#statistics" className="transition-colors duration-200 hover:text-white">
                  General Statistics
                </a>
              </li>
              <li>
                <a
                  href="#state-dashboard"
                  className="transition-colors duration-200 hover:text-white"
                >
                  State Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Policies & Disclaimer */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-white uppercase">
              Policies & Help
            </h3>
            <ul className="space-y-3 text-xs font-semibold">
              <li>
                <a
                  href="#privacy-policy"
                  className="transition-colors duration-200 hover:text-white"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#terms-of-service"
                  className="transition-colors duration-200 hover:text-white"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#disclaimer" className="transition-colors duration-200 hover:text-white">
                  Disclaimer Notice
                </a>
              </li>
              <li>
                <a
                  href="#accessibility-statement"
                  className="transition-colors duration-200 hover:text-white"
                >
                  Accessibility Statement
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors duration-200 hover:text-white">
                  Help Center & FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-white uppercase">
              Contact & Helpline
            </h3>
            <div className="space-y-3 text-xs leading-relaxed font-semibold">
              <p>CSCRS Central Secretariat Desk</p>
              <p>Email: support@cscrs-portal.gov.in</p>
              <p>Grievance Helpline: 1800-180-5324 (Toll-Free)</p>
              <p className="text-[10px] font-bold tracking-wide text-neutral-500 uppercase">
                SLA Central Monitoring Wing
              </p>
            </div>
          </div>

          {/* Column 4: App Download & Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-white uppercase">
              Citizen Companion App
            </h3>
            <div className="flex items-center space-x-4">
              {/* QR code container placeholder */}
              <div className="border-neutral-850 flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-white p-2 shadow-lg">
                <span className="text-center text-[10px] leading-tight font-black text-neutral-800 uppercase select-none">
                  QR Code
                </span>
              </div>
              <div className="flex flex-grow flex-col space-y-2">
                <div className="hover:bg-neutral-850 flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 px-4 shadow-sm transition-colors hover:border-neutral-700">
                  <span className="text-[11px] font-extrabold tracking-widest text-white uppercase">
                    Google Play
                  </span>
                </div>
                <div className="hover:bg-neutral-850 flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 px-4 shadow-sm transition-colors hover:border-neutral-700">
                  <span className="text-[11px] font-extrabold tracking-widest text-white uppercase">
                    App Store
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-8 h-px bg-neutral-800" />

        {/* Footer bottom metadata block containing copyright, social links, version signatures */}
        <div className="text-neutral-450 flex flex-col items-center justify-between space-y-6 text-xs md:flex-row md:space-y-0">
          <div className="space-y-1.5 text-center font-semibold md:text-left">
            <p>&copy; {currentYear} CSCRS Portal. Ministry of Housing & Urban Governance.</p>
            <p className="text-[11px] font-medium text-neutral-500">
              Designed and maintained under National digital infrastructure standards.
            </p>
          </div>

          {/* Metadata: Version and updates */}
          <div className="space-y-1.5 text-center font-semibold md:text-right">
            <p>Last Updated: {APP_CONFIG.lastUpdatedDate}</p>
            <p className="text-[11px] font-medium text-neutral-500">
              Build Version: {APP_CONFIG.version}
            </p>
          </div>

          {/* Social Links with "Follow Us" heading */}
          <div className="flex flex-col items-center space-y-2 md:items-start">
            <span className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">
              Follow Us
            </span>
            <div className="flex items-center space-x-5">
              {/* Facebook */}
              <a
                href="#facebook"
                aria-label="Visit Facebook"
                className="to-indigo-850 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 text-white shadow-md shadow-blue-500/10 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg
                  className="h-5 w-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z" />
                </svg>
              </a>

              {/* Twitter/X */}
              <a
                href="#twitter"
                aria-label="Visit Twitter"
                className="from-neutral-850 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800/80 bg-gradient-to-br via-neutral-900 to-neutral-950 text-white shadow-md shadow-black/30 transition-all duration-200 hover:scale-105 hover:border-neutral-700 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <svg
                  className="h-4.5 w-4.5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#instagram"
                aria-label="Visit Instagram"
                className="to-purple-650 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 text-white shadow-md shadow-pink-500/10 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20"
              >
                <svg
                  className="h-5 w-5 fill-none stroke-current"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="#linkedin"
                aria-label="Visit LinkedIn"
                className="to-indigo-650 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 text-white shadow-md shadow-blue-400/10 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/20"
              >
                <svg
                  className="h-4.5 w-4.5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="#youtube"
                aria-label="Visit YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-600/10 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-600/20"
              >
                <svg
                  className="h-5.5 w-5.5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.518 3.5 12 3.5 12 3.5s-7.517 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.483 20.5 12 20.5 12 20.5s7.518 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
