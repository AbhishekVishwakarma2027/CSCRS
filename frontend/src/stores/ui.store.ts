import { create } from 'zustand'

interface UIState {
  /** Whether the navigation sidebar is expanded (desktop). */
  isSidebarOpen: boolean
  /** Toggle sidebar open/closed. */
  toggleSidebar: () => void
  /** Force sidebar to a specific state. */
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
