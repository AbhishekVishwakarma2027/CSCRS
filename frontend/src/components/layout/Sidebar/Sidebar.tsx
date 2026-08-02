import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { SIDEBAR_MENU_GROUPS, type SidebarConfigItem } from './sidebar.config'

// Helper component to render icons dynamically
function SidebarIcon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const IconComponent = (
    Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  )[name]
  if (!IconComponent) return <Icons.HelpCircle className={className} />
  return <IconComponent className={className} />
}

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  // Filter groups and items by user role
  const visibleGroups = useMemo(() => {
    if (!user) return []
    return SIDEBAR_MENU_GROUPS.map((group) => {
      const visibleItems = group.items.filter((item) => item.roles.includes(user.role))
      return { ...group, items: visibleItems }
    }).filter((group) => group.items.length > 0)
  }, [user])

  // Flattened items for easy traversal in lifecycle checks
  const visibleItemsFlat = useMemo(() => {
    return visibleGroups.flatMap((group) => group.items)
  }, [visibleGroups])

  // Auto-expand menus if a child is active on route change
  useEffect(() => {
    visibleItemsFlat.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) =>
            location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        )
        if (isChildActive) {
          setExpandedMenus((prev) => ({ ...prev, [item.id]: true }))
        }
      }
    })
  }, [location.pathname, visibleItemsFlat])

  const toggleSubmenu = (menuId: string) => {
    if (isCollapsed) {
      onToggleCollapse()
      setExpandedMenus((prev) => ({ ...prev, [menuId]: true }))
    } else {
      setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }))
    }
  }

  // Active check helper
  const isItemActive = (item: SidebarConfigItem) => {
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
      return true
    }
    if (item.children) {
      return item.children.some(
        (child) =>
          location.pathname === child.path || location.pathname.startsWith(child.path + '/')
      )
    }
    return false
  }

  const renderMenuItem = (item: SidebarConfigItem, isSubItem = false) => {
    const isActive = isItemActive(item)
    const hasChildren = !!item.children && item.children.length > 0
    const isExpanded = !!expandedMenus[item.id]

    // Filter visible children
    const visibleChildren = item.children
      ? item.children.filter((child) => user && child.roles.includes(user.role))
      : []

    if (hasChildren && visibleChildren.length === 0) return null

    // Polished enterprise border highlight and smooth hover states
    const baseItemClasses = `flex items-center justify-between text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer select-none ${
      isActive
        ? 'bg-[#0A3C7D]/10 text-[#0A3C7D] border-l-3 border-[#0A3C7D] pl-2 rounded-l-none rounded-r-lg dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white'
    } ${
      isSubItem
        ? isActive
          ? 'pl-8 pr-3 py-2 border-l-2'
          : 'pl-9 pr-3 py-2'
        : isActive
          ? 'pr-3 py-2.5'
          : 'px-3 py-2.5'
    }`

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button onClick={() => toggleSubmenu(item.id)} className={`w-full ${baseItemClasses}`}>
            <div className="flex min-w-0 items-center space-x-2.5">
              <SidebarIcon name={item.icon} className="h-4 w-4 shrink-0 transition-transform" />
              {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.title}</span>}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-250 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            )}
          </button>

          {/* Children items list with vertical layout spacing */}
          {isExpanded && (!isCollapsed || isMobileOpen) && (
            <div className="mt-1 space-y-1 transition-all">
              {visibleChildren.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link key={item.id} to={item.path} className={baseItemClasses}>
        <div className="flex min-w-0 items-center space-x-2.5">
          <SidebarIcon name={item.icon} className="h-4 w-4 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="flex-1 truncate">{item.title}</span>}
        </div>

        {item.badge && (!isCollapsed || isMobileOpen) && (
          <span className="shrink-0 rounded border border-[#0D9488]/15 bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-black text-[#0D9488] transition-all">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  // Sidebar container content
  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* Brand logo header */}
      <div className="flex h-16 items-center border-b border-neutral-100 px-4 select-none dark:border-neutral-800">
        <Link to="/dashboard" className="group flex cursor-pointer items-center space-x-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0A3C7D] text-base font-black text-white shadow-sm transition-colors duration-200 group-hover:bg-[#0D9488]">
            C
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-sm leading-none font-black tracking-tight text-neutral-800 transition-colors group-hover:text-[#0A3C7D] dark:text-white">
                CSCRS Portal
              </span>
              <span className="mt-1 text-[9px] leading-none font-bold tracking-widest text-neutral-400 uppercase">
                Civic Governance
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main navigation list divided by section groups */}
      <nav className="flex-1 scrollbar-thin space-y-4 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.id} className="mt-5 space-y-1.5 first:mt-0">
            {/* Optional Group Title Headers */}
            {group.title && (!isCollapsed || isMobileOpen) && (
              <span className="mb-1.5 block px-3 text-[9px] font-black tracking-[0.15em] text-neutral-400 uppercase select-none dark:text-neutral-500">
                {group.title}
              </span>
            )}
            <div className="space-y-1.5">{group.items.map((item) => renderMenuItem(item))}</div>
          </div>
        ))}
      </nav>

      {/* Desktop expand/collapse trigger button */}
      <div className="hidden border-t border-neutral-100 p-3 lg:block dark:border-neutral-800">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center space-x-2.5 rounded-lg px-3 py-2.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          {isCollapsed ? (
            <>
              <PanelLeft className="h-4 w-4 shrink-0" />
              <span className="sr-only">Expand Sidebar</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 hidden h-screen transition-all duration-300 ease-in-out select-none lg:block ${
          isCollapsed ? 'w-20' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="animate-slide-in relative flex h-full w-72 max-w-xs flex-col bg-white shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
export default Sidebar
