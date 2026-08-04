import React from 'react'

export function CitizensTab() {
  return (
    <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-xs dark:bg-[#1E1E20]">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-[15px] font-black tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
          Citizens Directory
        </h3>
        <p className="mt-2 max-w-sm text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
          Directory records will appear here when administrative directory services become
          available.
        </p>
      </div>
    </div>
  )
}
