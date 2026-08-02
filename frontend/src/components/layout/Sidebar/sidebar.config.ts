import { UserRole } from '@/types/auth.types'

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
        id: 'users-parent',
        title: 'User Directories',
        path: '/users',
        icon: 'Users',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN],
        children: [
          {
            id: 'users-admins',
            title: 'City Admins',
            path: '/users/city-admins',
            icon: 'ShieldAlert',
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'users-dept-admins',
            title: 'Department Admins',
            path: '/users/department-admins',
            icon: 'Shield',
            roles: [UserRole.CITY_ADMIN],
          },
          {
            id: 'users-workers',
            title: 'Field Workers',
            path: '/users/workers',
            icon: 'Briefcase',
            roles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN],
          },
          {
            id: 'users-citizens',
            title: 'Citizens',
            path: '/users/citizens',
            icon: 'User',
            roles: [UserRole.CITY_ADMIN],
          },
        ],
      },
      {
        id: 'feedback',
        title: 'Citizen Feedback',
        path: '/feedback',
        icon: 'MessageSquare',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN],
      },
    ],
  },
  {
    id: 'system',
    title: 'Platform Maintenance',
    items: [
      {
        id: 'system-issues',
        title: 'System Health & Bugs',
        path: '/system-issues',
        icon: 'Activity',
        roles: [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN],
      },
    ],
  },
]
