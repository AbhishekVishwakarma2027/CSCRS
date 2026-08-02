import Emblem from '../../assets/Emblem.jpg'
import DigitalIndiaLogo from '../../assets/digital-india.png'

export function GovernmentHeader() {
  return (
    <header className="border-neutral-150 border-b bg-white py-2 select-none">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* Left Section: Department & Government Branding */}
        <div className="flex items-center justify-start gap-1">
          {/* Emblem Image Casing (No borders/shadows) */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <img src={Emblem} alt="Emblem" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[13px] font-extrabold tracking-widest text-neutral-500 uppercase">
              Department of Urban Governance
            </p>
            <p className="text-xs font-black tracking-tight text-neutral-800">
              State Government of Civic Administration
            </p>
          </div>
        </div>

        {/* Center Section: Main Portal branding (perfectly center-aligned, larger text) */}
        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2.5">
            <span className="text-3xl font-extrabold tracking-tight text-[#0A3C7D] md:text-4xl">
              CSCRS
            </span>
            <span className="h-6 w-px bg-neutral-300" />
            <span className="text-base font-bold tracking-widest text-neutral-500 uppercase md:text-lg">
              Portal
            </span>
          </div>
          <p className="text-[10px] font-extrabold tracking-wider text-neutral-600 uppercase md:text-xs">
            Crowdsourced Civic Issue Reporting & Resolution System
          </p>
        </div>

        {/* Right Section: Digital India Logo */}
        <div className="flex items-center justify-start lg:justify-end">
          <img
            src={DigitalIndiaLogo}
            alt="Digital India"
            className="h-12 w-auto object-contain md:h-14"
          />
        </div>
      </div>
    </header>
  )
}
