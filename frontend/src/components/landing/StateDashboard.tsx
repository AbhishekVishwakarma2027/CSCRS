import { useState } from 'react'
import { FileText, CheckCircle, Building, Users, Clock, ThumbsUp } from 'lucide-react'

interface DistrictStats {
  name: string
  totalReports: number
  resolvedReports: number
  departments: number
  workers: number
  resolutionTime: string
  satisfaction: string
}

const DISTRICT_DATA: Record<string, DistrictStats> = {
  lucknow: {
    name: 'Lucknow Division',
    totalReports: 24350,
    resolvedReports: 22930,
    departments: 18,
    workers: 480,
    resolutionTime: '22.8 hrs',
    satisfaction: '93.5%',
  },
  kanpur: {
    name: 'Kanpur Division',
    totalReports: 19850,
    resolvedReports: 18000,
    departments: 18,
    workers: 390,
    resolutionTime: '26.4 hrs',
    satisfaction: '91.8%',
  },
  ghaziabad: {
    name: 'Ghaziabad Division',
    totalReports: 23716,
    resolvedReports: 22596,
    departments: 18,
    workers: 420,
    resolutionTime: '21.5 hrs',
    satisfaction: '95.2%',
  },
  agra: {
    name: 'Agra Division',
    totalReports: 15420,
    resolvedReports: 14440,
    departments: 18,
    workers: 310,
    resolutionTime: '25.0 hrs',
    satisfaction: '92.4%',
  },
  varanasi: {
    name: 'Varanasi Division',
    totalReports: 18910,
    resolvedReports: 17760,
    departments: 18,
    workers: 350,
    resolutionTime: '23.8 hrs',
    satisfaction: '94.0%',
  },
  meerut: {
    name: 'Meerut Division',
    totalReports: 16750,
    resolvedReports: 15800,
    departments: 18,
    workers: 330,
    resolutionTime: '24.2 hrs',
    satisfaction: '93.0%',
  },
  prayagraj: {
    name: 'Prayagraj Division',
    totalReports: 14320,
    resolvedReports: 13510,
    departments: 18,
    workers: 280,
    resolutionTime: '25.8 hrs',
    satisfaction: '92.1%',
  },
}

const STATE_SUMMARY: DistrictStats = {
  name: 'State Summary (Uttar Pradesh Region)',
  totalReports: 154800,
  resolvedReports: 142400,
  departments: 18,
  workers: 3200,
  resolutionTime: '24.5 hrs',
  satisfaction: '94.2%',
}

export function StateDashboard() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)

  const activeStats = (hoveredDistrict ? DISTRICT_DATA[hoveredDistrict] : null) || STATE_SUMMARY

  return (
    <section
      id="state-dashboard"
      className="border-neutral-150 border-b bg-transparent py-16 select-none md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-xs font-extrabold tracking-widest text-[#0A3C7D] uppercase">
            Jurisdictional Performance
          </h2>
          <p className="text-neutral-855 mt-1 text-3xl font-black">State Dashboard Snapshot</p>
          <div className="mx-auto mt-3 h-1 w-12 rounded bg-[#0A3C7D]" />
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Left Column: Interactive Map Placeholder */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm lg:col-span-5">
            <div>
              <span className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                Interactive Jurisdiction Selector
              </span>
              <h3 className="text-neutral-855 mt-1 mb-4 text-lg font-black">
                State Map & Regional Highlights
              </h3>
            </div>

            {/* Mock Stylized Map using premium SVG district coordinates layout */}
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <svg
                viewBox="0 0 400 300"
                className="h-full max-h-[250px] w-full text-neutral-200 transition-all duration-300"
              >
                {/* District Lucknow */}
                <path
                  d="M 170 120 L 230 110 L 250 150 L 190 170 Z"
                  fill={hoveredDistrict === 'lucknow' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'lucknow' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'lucknow' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('lucknow')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="195"
                  y="145"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Lucknow
                </text>

                {/* District Kanpur */}
                <path
                  d="M 120 150 L 180 145 L 190 190 L 130 195 Z"
                  fill={hoveredDistrict === 'kanpur' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'kanpur' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'kanpur' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('kanpur')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="145"
                  y="175"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Kanpur
                </text>

                {/* District Ghaziabad */}
                <path
                  d="M 50 60 L 110 50 L 120 100 L 60 110 Z"
                  fill={hoveredDistrict === 'ghaziabad' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'ghaziabad' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'ghaziabad' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('ghaziabad')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="70"
                  y="85"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Ghaziabad
                </text>

                {/* District Meerut */}
                <path
                  d="M 40 10 L 100 5 L 110 50 L 50 60 Z"
                  fill={hoveredDistrict === 'meerut' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'meerut' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'meerut' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('meerut')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="65"
                  y="32"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Meerut
                </text>

                {/* District Agra */}
                <path
                  d="M 80 150 L 130 140 L 140 190 L 90 200 Z"
                  fill={hoveredDistrict === 'agra' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'agra' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'agra' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('agra')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="105"
                  y="175"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Agra
                </text>

                {/* District Varanasi */}
                <path
                  d="M 260 180 L 320 170 L 340 220 L 280 230 Z"
                  fill={hoveredDistrict === 'varanasi' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'varanasi' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'varanasi' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('varanasi')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="290"
                  y="205"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Varanasi
                </text>

                {/* District Prayagraj */}
                <path
                  d="M 200 190 L 260 180 L 280 230 L 220 240 Z"
                  fill={hoveredDistrict === 'prayagraj' ? 'rgba(10, 60, 125, 0.08)' : 'transparent'}
                  stroke={hoveredDistrict === 'prayagraj' ? '#0A3C7D' : 'oklch(0.922 0 0)'}
                  strokeWidth={hoveredDistrict === 'prayagraj' ? '2.5' : '1.5'}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict('prayagraj')}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x="230"
                  y="215"
                  className="pointer-events-none fill-neutral-500 text-[8px] font-bold select-none"
                >
                  Prayagraj
                </text>
              </svg>
            </div>

            <p className="text-neutral-450 mt-4 text-center text-[13px] font-semibold">
              Hover over a district region above to see local operation snapshot data
            </p>
          </div>

          {/* Right Column: High-level Public Metrics Only (6 Cards - standard 16px radii & equal heights) */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
            {/* Header info */}
            <div className="border-neutral-250/60 flex items-center justify-between rounded-xl border bg-neutral-50 px-4 py-2 text-sm font-bold text-neutral-600 shadow-sm">
              <span>Active Context: {activeStats.name}</span>
              {hoveredDistrict && (
                <span className="text-[9px] font-bold tracking-wider text-[#0A3C7D] uppercase">
                  District View
                </span>
              )}
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. Total Reports */}
              <div className="hover:border-neutral-350 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Total Reports
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-blue-50/50 group-hover:text-[#0A3C7D]">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">
                  {activeStats.totalReports.toLocaleString()}
                </p>
              </div>

              {/* 2. Resolved Reports */}
              <div className="hover:border-neutral-350 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Resolved Reports
                  </span>
                  <div className="group-hover:text-emerald-650 rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-emerald-50/50">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">
                  {activeStats.resolvedReports.toLocaleString()}
                </p>
              </div>

              {/* 3. Departments */}
              <div className="hover:border-neutral-355 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Active Departments
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:text-neutral-700">
                    <Building className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">{activeStats.departments}</p>
              </div>

              {/* 4. Active Workers */}
              <div className="hover:border-neutral-350 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Active Workers
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-blue-50/50 group-hover:text-[#0A3C7D]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">
                  {activeStats.workers.toLocaleString()}
                </p>
              </div>

              {/* 5. Average Resolution Time */}
              <div className="hover:border-neutral-350 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Avg Resolution Speed
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-amber-50/50 group-hover:text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">{activeStats.resolutionTime}</p>
              </div>

              {/* 6. Citizen Satisfaction */}
              <div className="hover:border-neutral-350 group flex h-32 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-250 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-neutral-450 text-[10px] font-extrabold tracking-wider uppercase">
                    Citizen Satisfaction
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-teal-50/50 group-hover:text-[#0D9488]">
                    <ThumbsUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-neutral-850 text-2xl font-black">{activeStats.satisfaction}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
