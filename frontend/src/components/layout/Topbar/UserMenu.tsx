import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useMyProfileQuery } from '@/features/profile/hooks/use-profile'
import { RoleBadge } from '../RoleBadge'
import { PATHS } from '@/routes/paths'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { data: profile } = useMyProfileQuery()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      navigate(PATHS.LOGIN)
    } catch {
      toast.error('Failed to log out cleanly')
    }
  }

  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative font-sans" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center space-x-2 rounded-lg p-1.5 transition-all duration-200 outline-none hover:bg-neutral-100 focus:ring-2 focus:ring-blue-500 dark:hover:bg-neutral-800"
        aria-expanded={isOpen}
        aria-label="User Account Menu"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#0A3C7D] text-xs font-black text-white shadow-sm select-none">
          {profile?.profile_image ? (
            <img src={profile.profile_image} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </div>

        <div className="hidden shrink-0 flex-col items-start text-left sm:flex">
          <span className="text-[13px] leading-tight font-black tracking-tight text-neutral-800 dark:text-neutral-200">
            {user.name}
          </span>
          <span className="text-neutral-450 mt-0.5 text-[11px] leading-none font-bold tracking-wider uppercase">
            Admin Profile
          </span>
        </div>
        <ChevronDown className="hidden h-4 w-4 shrink-0 text-neutral-400 sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="border-neutral-250 animate-slide-in absolute right-0 z-50 mt-2 w-64 origin-top-right transform overflow-hidden rounded-xl border bg-white shadow-xl transition-all duration-200 dark:border-neutral-800 dark:bg-[#1C1C1E]">
          {/* User Details header */}
          <div className="flex flex-col items-start border-b border-neutral-100 bg-neutral-50/50 p-4 select-none dark:border-neutral-800 dark:bg-neutral-900/30">
            <span className="dark:text-neutral-250 block text-[13px] leading-tight font-black text-neutral-800">
              {user.name}
            </span>
            <span className="mt-1 block w-full truncate text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
              {user.email}
            </span>
            <div className="mt-2.5">
              <RoleBadge role={user.role} />
            </div>
          </div>

          {/* Action Links */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate(PATHS.PROFILE)
              }}
              className="dark:text-neutral-350 flex w-full cursor-pointer items-center space-x-2.5 px-4 py-2.5 text-[13px] font-bold text-neutral-700 transition-colors outline-none hover:bg-neutral-50 hover:text-[#0A3C7D] focus:bg-neutral-50 focus:text-[#0A3C7D] dark:hover:bg-neutral-800/45 dark:hover:text-blue-400 dark:focus:bg-neutral-800/45 dark:focus:text-blue-400"
            >
              <User className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                toast.info('Settings implementation planned for a later phase.')
              }}
              className="dark:text-neutral-350 flex w-full cursor-pointer items-center space-x-2.5 px-4 py-2.5 text-[13px] font-bold text-neutral-700 transition-colors outline-none hover:bg-neutral-50 hover:text-[#0A3C7D] focus:bg-neutral-50 focus:text-[#0A3C7D] dark:hover:bg-neutral-800/45 dark:hover:text-blue-400 dark:focus:bg-neutral-800/45 dark:focus:text-blue-400"
            >
              <Settings className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

          {/* Logout Action */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center space-x-2.5 px-4 py-2.5 text-[13px] font-bold text-rose-600 transition-colors outline-none hover:bg-rose-50/50 focus:bg-rose-50/50 dark:text-rose-400 dark:hover:bg-rose-950/20 dark:focus:bg-rose-950/20"
            >
              <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
              <span>Secure Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default UserMenu
