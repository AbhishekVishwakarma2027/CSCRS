import { useEffect, useState, useMemo } from 'react'
import { FileText, CheckCircle, Building, Users, Clock, Award } from 'lucide-react'
import {
  publicService,
  type StateDashboardResponse,
  type DistrictSummaryItem,
} from '@/features/public/services/public.service'

interface PolygonGeometry {
  type: 'Polygon'
  coordinates: number[][][]
}

interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

interface GeoFeature {
  type: string
  properties: {
    district: string
    state: string
  }
  geometry: PolygonGeometry | MultiPolygonGeometry
}

interface GeoJSONData {
  features: GeoFeature[]
}

interface TooltipState {
  x: number
  y: number
  name: string
  reports: number
}

export function StateDashboard() {
  const [dashboardData, setDashboardData] = useState<StateDashboardResponse | null>(null)
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    // 1. Fetch live State Dashboard statistics
    publicService
      .getStateDashboard('Uttar Pradesh', controller.signal)
      .then((data) => {
        if (isMounted) {
          setDashboardData(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })

    // 2. Load official UP District GeoJSON boundary dataset
    fetch('/assets/up_districts.json', { signal: controller.signal })
      .then((res) => res.json())
      .then((data: GeoJSONData) => {
        if (isMounted) setGeoData(data)
      })
      .catch(() => {})

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Map of district name -> total reports for fast lookup
  const reportCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    if (dashboardData?.districts) {
      for (const d of dashboardData.districts) {
        map[d.district] = d.total_reports
      }
    }
    return map
  }, [dashboardData])

  // Maximum report count across all districts for dynamic choropleth scaling
  const maxReports = useMemo(() => {
    const counts = Object.values(reportCountMap)
    return counts.length > 0 ? Math.max(...counts) : 0
  }, [reportCountMap])

  // Get dynamic choropleth fill color based on district report density
  const getDistrictFill = (reports: number): string => {
    if (reports === 0 || maxReports === 0) {
      return 'rgba(241, 245, 249, 0.85)' // Neutral slate-100 for 0 reports
    }

    const ratio = reports / maxReports
    if (ratio <= 0.25) return 'rgba(147, 197, 253, 0.55)' // Light blue (slate/blue 300)
    if (ratio <= 0.5) return 'rgba(59, 130, 246, 0.75)' // Medium blue (blue-500)
    if (ratio <= 0.75) return 'rgba(29, 78, 216, 0.88)' // Dark blue (blue-700)
    return 'rgba(10, 60, 125, 0.98)' // Deepest brand blue (#0A3C7D)
  }

  // Calculate dynamic bounding box and optimized projection parameters from GeoJSON
  const projection = useMemo(() => {
    if (!geoData || !geoData.features.length) return null

    let minLon = 180
    let maxLon = -180
    let minLat = 90
    let maxLat = -90

    const processPoint = (lon: number, lat: number) => {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    for (const feature of geoData.features) {
      const geom = feature.geometry
      if (geom.type === 'Polygon') {
        for (const ring of geom.coordinates) {
          for (const pt of ring) {
            if (pt[0] !== undefined && pt[1] !== undefined) {
              processPoint(pt[0], pt[1])
            }
          }
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          for (const ring of poly) {
            for (const pt of ring) {
              if (pt[0] !== undefined && pt[1] !== undefined) {
                processPoint(pt[0], pt[1])
              }
            }
          }
        }
      }
    }

    const width = 640
    const height = 460
    const padding = 10 // Minimal padding to maximize render size

    const contentWidth = width - padding * 2
    const contentHeight = height - padding * 2

    const midLat = (minLat + maxLat) / 2
    const midLatRad = (midLat * Math.PI) / 180

    const geoWidth = (maxLon - minLon) * Math.cos(midLatRad)
    const geoHeight = maxLat - minLat

    const scaleX = contentWidth / geoWidth
    const scaleY = contentHeight / geoHeight
    const scale = Math.min(scaleX, scaleY)

    const xOffset = padding + (contentWidth - geoWidth * scale) / 2
    const yOffset = padding + (contentHeight - geoHeight * scale) / 2

    const projectPoint = (lon: number, lat: number): [number, number] => {
      const x = xOffset + (lon - minLon) * Math.cos(midLatRad) * scale
      const y = yOffset + (maxLat - lat) * scale
      return [x, y]
    }

    const projectRing = (ring: number[][]): string => {
      if (!ring || ring.length === 0) return ''
      return (
        ring
          .map((coord, idx) => {
            const lon = coord[0] ?? 0
            const lat = coord[1] ?? 0
            const [x, y] = projectPoint(lon, lat)
            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
          })
          .join(' ') + ' Z'
      )
    }

    const projectGeometry = (geom: PolygonGeometry | MultiPolygonGeometry): string => {
      if (geom.type === 'Polygon') {
        return geom.coordinates.map((ring) => projectRing(ring)).join(' ')
      } else if (geom.type === 'MultiPolygon') {
        return geom.coordinates
          .map((poly) => poly.map((ring) => projectRing(ring)).join(' '))
          .join(' ')
      }
      return ''
    }

    return { projectGeometry }
  }, [geoData])

  // Determine active context stats (Hovered > Selected > State Summary)
  const activeDistrictName = hoveredDistrict || selectedDistrict
  const activeDistrictStats: DistrictSummaryItem | null = activeDistrictName
    ? dashboardData?.districts.find((d) => d.district === activeDistrictName) || null
    : null

  const activeStats = activeDistrictStats
    ? {
        name: `${activeDistrictStats.district} District`,
        totalReports: activeDistrictStats.total_reports,
        resolvedReports: activeDistrictStats.resolved_reports,
        departments: activeDistrictStats.active_departments,
        workers: activeDistrictStats.active_workers,
        resolutionTime: `${activeDistrictStats.average_resolution_hours} hrs`,
        resolutionRate:
          activeDistrictStats.total_reports > 0
            ? `${Math.round((activeDistrictStats.resolved_reports / activeDistrictStats.total_reports) * 100)}%`
            : '100%',
      }
    : {
        name: 'State Summary (Uttar Pradesh Region)',
        totalReports: dashboardData?.total_reports ?? 0,
        resolvedReports: dashboardData?.resolved_reports ?? 0,
        departments: dashboardData?.active_departments ?? 0,
        workers: dashboardData?.active_workers ?? 0,
        resolutionTime: `${dashboardData?.average_resolution_hours ?? 0} hrs`,
        resolutionRate: `${dashboardData?.resolution_rate ?? 0}%`,
      }

  return (
    <section
      id="state-dashboard"
      className="border-neutral-150 border-b bg-transparent py-12 select-none md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-xs font-extrabold tracking-widest text-[#0A3C7D] uppercase">
            Jurisdictional Performance
          </h2>
          <p className="text-neutral-855 mt-1 text-3xl font-black">State Dashboard Analytics</p>
          <div className="mx-auto mt-3 h-1 w-12 rounded bg-[#0A3C7D]" />
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Expanded Interactive Map Selector (6 Columns) */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm lg:col-span-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                  Interactive Map (75 Districts)
                </span>
                {maxReports > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0A3C7D]">
                    Live Heatmap Active
                  </span>
                )}
              </div>
              <h3 className="text-neutral-855 mt-1 mb-3 text-lg font-black">
                Uttar Pradesh Regional Highlights
              </h3>
            </div>

            {/* Interactive SVG GeoJSON Renderer - Maximized Render Area */}
            <div className="relative flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm sm:min-h-[380px]">
              {geoData && projection ? (
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 640 460"
                    className="h-full max-h-[440px] w-full transition-all duration-300"
                    onMouseLeave={() => {
                      setHoveredDistrict(null)
                      setTooltip(null)
                    }}
                  >
                    {geoData.features.map((feature, idx) => {
                      const distName = feature.properties.district
                      const isSelected = selectedDistrict === distName
                      const isHovered = hoveredDistrict === distName
                      const pathData = projection.projectGeometry(feature.geometry)
                      const reports = reportCountMap[distName] || 0
                      const baseFill = getDistrictFill(reports)

                      return (
                        <path
                          key={idx}
                          d={pathData}
                          fill={baseFill}
                          fillOpacity={isHovered ? 1 : isSelected ? 0.95 : 0.85}
                          stroke={
                            isHovered
                              ? '#0F172A'
                              : isSelected
                                ? '#0A3C7D'
                                : reports > 0
                                  ? '#1E40AF'
                                  : '#CBD5E1'
                          }
                          strokeWidth={isHovered ? '2.5' : isSelected ? '2.2' : '0.6'}
                          strokeLinejoin="round"
                          className="cursor-pointer transition-all duration-150 hover:brightness-110 hover:drop-shadow-md"
                          onMouseEnter={(e) => {
                            setHoveredDistrict(distName)
                            const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
                            if (rect) {
                              setTooltip({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                name: distName,
                                reports: reportCountMap[distName] || 0,
                              })
                            }
                          }}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
                            if (rect) {
                              setTooltip({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                name: distName,
                                reports: reportCountMap[distName] || 0,
                              })
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredDistrict(null)
                            setTooltip(null)
                          }}
                          onClick={() => {
                            setSelectedDistrict(distName)
                          }}
                        />
                      )
                    })}
                  </svg>

                  {/* Floating Tooltip */}
                  {tooltip && (
                    <div
                      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full transform rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-sm"
                      style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y - 8}px`,
                      }}
                    >
                      <div className="font-bold text-amber-300">{tooltip.name}</div>
                      <div className="text-[11px] text-slate-200">
                        {tooltip.reports} {tooltip.reports === 1 ? 'Report' : 'Reports'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs font-semibold text-neutral-400">
                    Loading Map Geometry...
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Map Choropleth Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold text-neutral-600 shadow-sm sm:flex-nowrap sm:gap-2">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase sm:text-[10px]">
                Report Density
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-neutral-400 sm:text-[10px]">0</span>
                <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-slate-200 via-blue-400 to-[#0A3C7D]" />
                <span className="text-[9px] font-black text-neutral-700 sm:text-[10px]">
                  {maxReports > 0 ? `${maxReports} Max` : 'High'}
                </span>
              </div>
            </div>

            <p className="mt-2 text-center text-[12px] font-semibold text-neutral-500">
              Hover over or click any district to filter live regional metrics
            </p>
          </div>

          {/* Right Column: Public Regional Performance Metrics (6 Compact Cards, Fixed Gap Grid) */}
          <div className="flex flex-col space-y-4 lg:col-span-6">
            {/* Header Context Indicator */}
            <div className="border-neutral-250/60 flex items-center justify-between rounded-xl border bg-neutral-50 px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm">
              <span className="truncate">Active Context: {activeStats.name}</span>
              {activeDistrictName && (
                <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-[#0A3C7D] uppercase">
                  District View
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. Total Reports */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Total Reports
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-blue-50/50 group-hover:text-[#0A3C7D]">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">
                    {activeStats.totalReports.toLocaleString()}
                  </p>
                )}
              </div>

              {/* 2. Resolved Reports */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Resolved Reports
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-emerald-50/50 group-hover:text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">
                    {activeStats.resolvedReports.toLocaleString()}
                  </p>
                )}
              </div>

              {/* 3. Active Departments */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Active Departments
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:text-neutral-700">
                    <Building className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">{activeStats.departments}</p>
                )}
              </div>

              {/* 4. Active Workers */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Active Workers
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-blue-50/50 group-hover:text-[#0A3C7D]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">
                    {activeStats.workers.toLocaleString()}
                  </p>
                )}
              </div>

              {/* 5. Average Resolution Speed */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Avg Resolution Speed
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-amber-50/50 group-hover:text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">
                    {activeStats.resolutionTime}
                  </p>
                )}
              </div>

              {/* 6. Resolution Efficiency Rate */}
              <div className="group flex h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                    Resolution Rate
                  </span>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 text-neutral-500 transition-colors group-hover:bg-teal-50/50 group-hover:text-[#0D9488]">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
                ) : (
                  <p className="text-2xl font-black text-neutral-900">
                    {activeStats.resolutionRate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
