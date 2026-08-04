import React, { useState } from 'react'
import { Users, Shield, User } from 'lucide-react'
import { DepartmentAdminsTab } from '../components/DepartmentAdminsTab'
import { CitizensTab } from '../components/CitizensTab'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'

export default function UserDirectoriesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'admins' | 'citizens'>('admins')

  return (
    <div className="space-y-6 pb-10 text-left">
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="dark:text-blue-450 flex items-center gap-1.5 text-2xl font-black tracking-widest text-[#0A3C7D] uppercase">
            <Users className="h-5 w-5" />
            User Directories
          </h2>
          <p className="text-neutral-450 mt-1 text-[13px] font-semibold dark:text-neutral-500">
            Manage system administrators, department heads, field workers, and citizens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
              activeTab === 'admins'
                ? 'bg-[#0A3C7D] text-white dark:bg-blue-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-[#1C1C1E] dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            Department Admins
          </button>

          {user && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.CITY_ADMIN) && (
            <button
              onClick={() => setActiveTab('citizens')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
                activeTab === 'citizens'
                  ? 'bg-[#0A3C7D] text-white dark:bg-blue-600'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-[#1C1C1E] dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <User className="h-4 w-4" />
              Citizens
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'admins' && <DepartmentAdminsTab />}
        {activeTab === 'citizens' && <CitizensTab />}
      </div>
    </div>
  )
}
