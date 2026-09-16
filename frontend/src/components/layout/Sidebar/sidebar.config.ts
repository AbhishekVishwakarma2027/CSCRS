import { UserRole } from '@/types/auth.types'
import { PATHS } from '@/routes/paths'

export interface SidebarConfigItem {
  id: string
  title: string
  path: string
  icon: string // Lucide icon string name
  roles: UserRole[]
  permission?: string
  badge?: string | number
  featureFlag?: string
  children?: SidebarConfigItem[]
}

export interface SidebarGroup {
  id: string
  title?: string // Optional group headers
  items: SidebarConfigItem[]
}

export const SIDEBAR_MENU_GROUPS: SidebarGroup[] = [
  {
    id: 'operations',
    title: 'Core Operations',
    items: [
      {
        id: 'dashboard',
        title: 'Overview Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'reports-parent',
        title: 'Civic Reports',
        path: '/reports',
        icon: 'FileText',
        roles: [UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'exports',
        title: 'Exports',
        path: '/exports',
        icon: 'Download',
        roles: [UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'workers',
        title: 'Field Workers',
        path: '/workers',
        icon: 'Users',
        roles: [UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'resolutions',
        title: 'Manual Verification',
        path: '/resolutions/manual-review',
        icon: 'ClipboardCheck',
        roles: [UserRole.DEPARTMENT_ADMIN],
        badge: 'Pending',
      },
      {
        id: 'transfer-requests',
        title: 'Transfer Requests',
        path: '/forward-requests',
        icon: 'ArrowLeftRight',
        roles: [UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'notifications',
        title: 'Notifications',
        path: PATHS.NOTIFICATIONS,
        icon: 'Bell',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
    ],
  },
  {
    id: 'management',
    title: 'Administration',
    items: [
      {
        id: 'departments',
        title: 'Municipal Departments',
        path: '/departments',
        icon: 'Building2',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN],
      },
      {
        id: 'users',
        title: 'User Directories',
        path: '/users',
        icon: 'Users',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN],
      },
      {
        id: 'feedback',
        title: 'Citizen Feedback',
        path: '/feedback',
        icon: 'MessageSquare',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
    ],
  },
  {
    id: 'system',
    title: 'Platform Maintenance',
    items: [
      {
        id: 'super-admin-governance',
        title: 'Platform Governance',
        path: PATHS.SUPER_ADMIN_GOVERNANCE,
        icon: 'ShieldCheck',
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        id: 'system-issues',
        title: 'System Health & Bugs',
        path: '/system-issues',
        icon: 'Activity',
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        id: 'submit-issue',
        title: 'Submit Issue',
        path: '/submit-issue',
        icon: 'AlertCircle',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
      {
        id: 'my-issues',
        title: 'My System Issues',
        path: '/my-issues',
        icon: 'ListCheck',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
      },
    ],
  },
]
