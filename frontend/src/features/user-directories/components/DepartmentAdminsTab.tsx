import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateDepartmentAdminModal } from './CreateDepartmentAdminModal'

export function DepartmentAdminsTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex h-9 items-center gap-2 bg-[#0A3C7D] px-4 text-[13px] font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Create Department Admin
        </Button>
      </div>

      <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-white shadow-xs dark:bg-[#1E1E20]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-semibold whitespace-nowrap text-neutral-600 dark:text-neutral-300">
            <thead>
              <tr className="dark:border-neutral-850 border-b border-neutral-200/60 bg-neutral-50/50 dark:bg-[#1C1C1E]">
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Name
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Email
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Department
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Status
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="p-0">
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900/50">
                      <svg
                        className="h-8 w-8 text-neutral-400 dark:text-neutral-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-[15px] font-black tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
                      No Records Available
                    </h3>
                    <p className="mt-2 max-w-sm text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                      Directory records will appear here when administrative directory services
                      become available.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <CreateDepartmentAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
