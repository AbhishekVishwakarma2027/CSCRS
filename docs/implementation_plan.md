# Implementation Plan — Reports Listing Workspace (Phase 5.1)

This plan details the implementation steps for **Phase 5.1 (Reports Listing Workspace)**. We will integrate a single Reports workspace under `/reports` that dynamically adapts data retrieval, styling, and action menus based on the active user role.

---

## 1. Production Architecture Design Refinements

### A. Centralized Query Keys Registry
To prevent cache naming collisions and prepare the app for later phases without code churn, we establish a future-proof, unified query keys registry:

```typescript
export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  lists: () => [...REPORTS_QUERY_KEYS.all, 'list'] as const,
  list: (role: string, filters: Record<string, any>) => [...REPORTS_QUERY_KEYS.lists(), role, filters] as const,
  details: () => [...REPORTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (reportNumber: string) => [...REPORTS_QUERY_KEYS.details(), reportNumber] as const,
  timelines: () => [...REPORTS_QUERY_KEYS.all, 'timeline'] as const,
  timeline: (reportId: number) => [...REPORTS_QUERY_KEYS.timelines(), reportId] as const,
  manualReviews: () => [...REPORTS_QUERY_KEYS.all, 'manual-review'] as const,
  manualReview: (reportId: number) => [...REPORTS_QUERY_KEYS.manualReviews(), reportId] as const,
  forwardRequests: () => [...REPORTS_QUERY_KEYS.all, 'forward-request'] as const,
  forwardRequest: (requestId: number) => [...REPORTS_QUERY_KEYS.forwardRequests(), requestId] as const,
}
```

### B. Separation of API Response DTOs from UI Presentation Models
The API response models returned by FastAPI are mapped to clean, frontend-tailored models in the service layer before reaching hooks or components. This insulates our components from changes to backend database column naming:

*   **API DTO Types**: `CityReportListItemApi`, `DepartmentReportListItemApi`, `PaginatedCityReportsApi`.
*   **UI Types**: `ReportListItem` (unifies properties so tables can treat City and Department report rows identically).
*   **Mapper Utility**: `mapReportApiToUi` converts dates to Date/string formats and unifies status properties.

### C. Standardized Service Layer Architecture
All service methods in `reports.service.ts` follow these rules:
1.  Accept an optional `signal?: AbortSignal` parameter, forwarded to Axios.
2.  Strictly return strongly typed DTO mappings (e.g. `Promise<ReportListItem[]>` or `Promise<PaginatedResponse<ReportListItem>>`).
3.  Avoid silent try-catch blocks. Let errors bubble up so TanStack Query can manage error states.
4.  Zero presentation/toast/routing side-effects.

---

## 2. Directory Structure & Files

We will establish a modular directory structure under the existing `features/reports` directory:

```
frontend/src/features/reports/
├── components/
│   ├── ReportsTable.tsx        # Uses @tanstack/react-table & reflows to cards on mobile
│   └── TableFilterHeader.tsx   # Debounced search, filters, density, column visibility
├── hooks/
│   └── use-reports.ts          # TanStack query hooks for listing and operations
├── pages/
│   └── ReportsPage.tsx         # Unified Page (/reports) adapting dynamically via user.role
├── services/
│   └── reports.service.ts      # Axios backend wrappers with transform mappers
└── types.ts                    # TypeScript types for API DTOs & UI presentation models
```

---

## 3. Files to Create

1.  **[NEW] [types.ts](file:///d:/Projects/CSCRS/frontend/src/features/reports/types.ts)**: Models for API and UI presentation layers.
2.  **[NEW] [reports.service.ts](file:///d:/Projects/CSCRS/frontend/src/features/reports/services/reports.service.ts)**: Axios call bindings and mapping functions.
3.  **[NEW] [use-reports.ts](file:///d:/Projects/CSCRS/frontend/src/features/reports/hooks/use-reports.ts)**: Query and mutation hooks.
4.  **[NEW] [ReportsTable.tsx](file:///d:/Projects/CSCRS/frontend/src/features/reports/components/ReportsTable.tsx)**: React-table layout and card layout.
5.  **[NEW] [TableFilterHeader.tsx](file:///d:/Projects/CSCRS/frontend/src/features/reports/components/TableFilterHeader.tsx)**: Filter UI.
6.  **[NEW] [ReportsPage.tsx](file:///d:/Projects/CSCRS/frontend/src/features/reports/pages/ReportsPage.tsx)**: Dynamic page wrapper.

---

## 4. Files to Modify

1.  **[MODIFY] [paths.ts](file:///d:/Projects/CSCRS/frontend/src/routes/paths.ts)**: Route paths.
2.  **[MODIFY] [index.tsx](file:///d:/Projects/CSCRS/frontend/src/routes/index.tsx)**: Lazy-load `/reports` route.
3.  **[MODIFY] [sidebar.config.ts](file:///d:/Projects/CSCRS/frontend/src/components/layout/Sidebar/sidebar.config.ts)**: Sidebar integration.

---

## 5. Verification Plan

### Automated Checks
*   Type compliance: `npm run typecheck`
*   Style check: `npm run lint`

### Manual Verification
*   Verify the `/reports` path resolves correctly for both City Admin and Department Admin.
*   Verify filters update URL search parameters, and settings (density, columns visibility) survive page reloads (via localStorage).
