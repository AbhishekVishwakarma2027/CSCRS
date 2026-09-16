import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../Sidebar/Sidebar'
import { Header } from '../Topbar/Header'
import { AnnouncementBanner } from '../Topbar/AnnouncementBanner'
import { Footer } from '../Footer'

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Persist sidebar collapsed state in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('cscrs_sidebar_collapsed')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('cscrs_sidebar_collapsed', String(isCollapsed))
  }, [isCollapsed])

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#121212]">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* 2. Main Layout Container */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-56'
        }`}
      >
        {/* Top Header Bar */}
        <Header onToggleSidebar={() => setIsMobileOpen(true)} />

        {/* Global Broadcast Announcement Banner */}
        <AnnouncementBanner />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 focus:outline-none sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>

        {/* System Footer Info */}
        <Footer />
      </div>
    </div>
  )
}
export default AppLayout
