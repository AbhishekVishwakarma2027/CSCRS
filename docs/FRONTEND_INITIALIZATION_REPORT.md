# CSCRS Portal — Frontend Initialization & Phase 3.1 Implementation Report

This report documents the architectural setup, configurations, directory structure, and the successful completion of the **Phase 3.1: Public Landing Page Foundation** for the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS) administrative portal.

---

## 1. Architectural Decisions Summary (Revision 2 Approved)

The frontend foundation has been established in strict accordance with the approved 11 architectural principles:

| # | Principle | Status | Implementation Details |
|---|---|---|---|
| **1** | **React Router Version** | Locked | React Router v6.30+ is used for routing stability and performance. |
| **2** | **Axios Retry** | Removed | `axios-retry` was omitted. Retry strategies will be managed manually for safe GET requests only. |
| **3** | **Auth Strategy** | Locked | Bearer token authorization header scheme. Access token is in memory (React state), and refresh token is managed in `localStorage` with automated rotation. |
| **4** | **User Roles** | Locked | Restricted strictly to administrative roles: `SuperAdmin`, `CityAdmin`, and `DepartmentAdmin`. Citizens and workers are out of scope. |
| **5** | **Portal Architecture** | Locked | A single unified portal utilizing role-adaptive navigation, dashboard cards, and actions based on the authenticated user's role. |
| **6** | **Routing Strategy** | Locked | Flat routing layout mapped inside a single route tree. No role-based route sub-trees. |
| **7** | **Notification Strategy** | Deferred | REST API polling is planned; exact polling details are deferred to Phase 3. |
| **8** | **OpenAPI Integration** | Deferred | Evaluated as a future enhancement for automated type generation; hand-crafted typings used in Phase 2. |
| **9** | **Development Backend** | Locked | Local development proxy is set up at `http://localhost:8000` via Vite's proxy configurations. |
| **10** | **Phase Scope** | Locked | Project initialization and folder structure created without introducing early feature code. |
| **11** | **API Contract** | Locked | Frontend strictly consumes the backend API surface. No API schema changes or modifications are allowed. |

---

## 2. Done Work Breakdown (Phases 2 & 3.1)

### A. Environment & Bundler Configurations
1. **[package.json](file:///d:/Projects/CSCRS/frontend/package.json)**: Set up with standard production scripts (`dev`, `build`, `lint`, `format`, `typecheck`) and dev dependencies.
2. **[vite.config.ts](file:///d:/Projects/CSCRS/frontend/vite.config.ts)**: Integrated with `@tailwindcss/vite` (Tailwind v4), alias resolver (`@/*` targeting `src/*`), and a dev server proxy forwarding `/api` requests to `http://localhost:8000`.
3. **[tsconfig.json](file:///d:/Projects/CSCRS/frontend/tsconfig.json)** & **[tsconfig.app.json](file:///d:/Projects/CSCRS/frontend/tsconfig.app.json)**: Enabled strict mode checking (`noUncheckedIndexedAccess`, `noImplicitReturns`). Cleaned up deprecated `baseUrl` options and added `"types": ["vite/client"]` to resolve Vite environment variables typing.
4. **[eslint.config.js](file:///d:/Projects/CSCRS/frontend/eslint.config.js)**: Flat config structure utilizing TypeScript strict linting and React Hooks rules.
5. **[prettier.config.js](file:///d:/Projects/CSCRS/frontend/prettier.config.js)**: Pre-configured format styling rules including automatic class sorting for Tailwind v4.
6. **[.env.local](file:///d:/Projects/CSCRS/frontend/.env.local)**: Configured with `VITE_API_BASE_URL=http://localhost:8000`.
7. **Git Hooks**: Integrated Husky v9 and `lint-staged` at the repository root to automatically run ESLint and Prettier checks on staged files during commit actions.

### B. UI Component System
1. **Tailwind CSS v4 & Fonts**: Initialized Tailwind v4 inside **[src/index.css](file:///d:/Projects/CSCRS/frontend/src/index.css)**, importing Geist Sans variable typography.
2. **shadcn/ui setup**: Initialized using the Radix UI base and `nova` preset. Created **[components.json](file:///d:/Projects/CSCRS/frontend/components.json)** and installed the core button primitive at **[components/ui/button.tsx](file:///d:/Projects/CSCRS/frontend/src/components/ui/button.tsx)**.

### C. Foundation Core Services
1. **[services/api/client.ts](file:///d:/Projects/CSCRS/frontend/src/services/api/client.ts)**: Configured the central Axios client. It intercepts outgoing requests to attach the `Authorization: Bearer <token>` header, intercepts 401 status responses, rotates tokens using `/api/v1/auth/refresh`, and utilizes a queued-promise pattern to resolve concurrent api requests without race conditions.
2. **[providers/auth-provider.tsx](file:///d:/Projects/CSCRS/frontend/src/providers/auth-provider.tsx)** & **[hooks/use-auth.ts](file:///d:/Projects/CSCRS/frontend/src/hooks/use-auth.ts)**: Built the React Auth Context and consumer hook that restores active sessions on application boot by validating the refresh token against `/api/v1/auth/me`.
3. **[lib/query-client.ts](file:///d:/Projects/CSCRS/frontend/src/lib/query-client.ts)**: Set up the TanStack Query client. Default configurations define a 60-second data fresh timer (`staleTime`), query retry exclusions (no automatic retries on 401, 403, 404, or 422 errors), and disabled mutation retries.
4. **Utilities & Shared Stores**: Created custom error formatting functions (`extractApiError`), role checker logic (`hasRole`), and a Zustand state store for UI toggles (`useUIStore`).

### D. Routing Guards
1. **[routes/paths.ts](file:///d:/Projects/CSCRS/frontend/src/routes/paths.ts)**: Centralized all route path mappings.
2. **[routes/protected-route.tsx](file:///d:/Projects/CSCRS/frontend/src/routes/protected-route.tsx)**: Protects routes from unauthenticated users, redirects back to `/login` (preserving target history), and checks role memberships for admin sub-features.
3. **[routes/public-route.tsx](file:///d:/Projects/CSCRS/frontend/src/routes/public-route.tsx)**: Redirects authenticated users away from public pages (like login/forgot password) to `/dashboard`.

### E. Public Landing Page Foundation (Phase 3.1)
Created and assembled a completely public-facing homepage separated from the administrative features:
- **Routing Integration**: Updated **[routes/index.tsx](file:///d:/Projects/CSCRS/frontend/src/routes/index.tsx)** to serve the lazy-loaded `LandingPage` directly at the root `/` path.
- **Root Page [src/pages/LandingPage.tsx](file:///d:/Projects/CSCRS/frontend/src/pages/LandingPage.tsx)**: Houses responsive layouts, semantic structure (`main id="main-content"`), and section placeholders for *Who We Are, How It Works, Platform Features, Latest Updates, FAQ, and Contact Form*.
- **Subcomponents [src/components/landing/](file:///d:/Projects/CSCRS/frontend/src/components/landing)**:
  - `AccessibilityBar.tsx` — Skip to content shortcut, font resize presets, contrast placeholders, and English/Hindi language toggle.
  - `GovernmentHeader.tsx` — Emblems, department metadata, and MyGov portal branding.
  - `Navbar.tsx` — Sticky header configuration, viewport-aware scroll highlight listener, language selection options, and an automatically closing mobile hamburger drawer.
  - `HeroSlider.tsx` — Carousel slider holding slide title, descriptions, background gradients, CTAs. Includes a 5-second automatic sliding loop, manual chevron selectors, indicators, and mouse-hover play pause controls.
  - `Statistics.tsx` — Live snapshot mockups displaying static values (Resolved Issues, Active Departments, Active Workers, Jurisdictions).
  - `Footer.tsx` — Grid layout containing links, help docs, and mock App Store download badges.
  - `index.ts` — Unified export header to keep code cleaner.

---

## 3. Current Project Tree

A complete view of the current files and directories inside the `frontend` folder:

```
frontend/
├── .env.example
├── .env.local
├── .gitignore
├── .husky/
│   └── pre-commit
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── prettier.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── app/
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── assets/
│   │   ├── hero.png
│   │   ├── typescript.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── common/
│   │   │   ├── DataTable/
│   │   │   │   └── .gitkeep
│   │   │   ├── ErrorBoundary/
│   │   │   │   └── .gitkeep
│   │   │   ├── FileUploader/
│   │   │   │   └── .gitkeep
│   │   │   ├── LoadingSpinner/
│   │   │   │   ├── .gitkeep
│   │   │   │   └── PageLoader.tsx
│   │   │   └── StatusBadge/
│   │   │       └── .gitkeep
│   │   ├── landing/
│   │   │   ├── AccessibilityBar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── GovernmentHeader.tsx
│   │   │   ├── HeroSlider.tsx
│   │   │   ├── index.ts
│   │   │   ├── Navbar.tsx
│   │   │   ├── Statistics.tsx
│   │   │   └── Footer.tsx
│   │   ├── layout/
│   │   │   ├── AppShell/
│   │   │   │   └── .gitkeep
│   │   │   ├── PublicLayout/
│   │   │   │   └── .gitkeep
│   │   │   ├── Sidebar/
│   │   │   │   └── .gitkeep
│   │   │   └── Topbar/
│   │   │       └── .gitkeep
│   │   └── ui/
│   │       ├── .gitkeep
│   │       └── button.tsx
│   ├── features/
│   │   ├── analytics/
│   │   │   └── .gitkeep
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── .gitkeep
│   │   │   ├── hooks/
│   │   │   │   └── .gitkeep
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       ├── NotFoundPage.tsx
│   │   │       └── UnauthorizedPage.tsx
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   └── .gitkeep
│   │   │   ├── hooks/
│   │   │   │   └── .gitkeep
│   │   │   └── pages/
│   │   │       └── DashboardPage.tsx
│   │   ├── departments/
│   │   │   └── .gitkeep
│   │   ├── forward-requests/
│   │   │   └── .gitkeep
│   │   ├── notifications/
│   │   │   └── .gitkeep
│   │   ├── platform/
│   │   │   └── .gitkeep
│   │   ├── profile/
│   │   │   └── .gitkeep
│   │   ├── reports/
│   │   │   └── .gitkeep
│   │   ├── resolutions/
│   │   │   └── .gitkeep
│   │   ├── settings/
│   │   │   └── .gitkeep
│   │   ├── system-issues/
│   │   │   └── .gitkeep
│   │   └── workers/
│   │       └── .gitkeep
│   ├── hooks/
│   │   ├── .gitkeep
│   │   └── use-auth.ts
│   ├── index.css
│   ├── lib/
│   │   ├── query-client.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── providers/
│   │   └── auth-provider.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── paths.ts
│   │   ├── protected-route.tsx
│   │   └── public-route.tsx
│   ├── schemas/
│   │   └── auth.schemas.ts
│   ├── services/
│   │   └── api/
│   │       ├── client.ts
│   │       └── index.ts
│   ├── stores/
│   │   └── ui.store.ts
│   ├── types/
│   │   ├── .gitkeep
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   └── utils/
│       ├── error.ts
│       ├── format.ts
│       └── role.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. Verification Check Report

Before building this report, all tests and compilation checks were verified inside the conda environment:

- **Linter Output (`eslint .`)**:
  ```
  cscrs-admin-portal@0.1.0 lint
  eslint .
  # [Output: Successful with 0 errors and 0 warnings]
  ```
- **TypeScript Compiler (`tsc --noEmit`)**:
  ```
  cscrs-admin-portal@0.1.0 typecheck
  tsc --noEmit
  # [Output: Successful with 0 errors and 0 warnings]
  ```
- **Production Build Bundler (`npm run build`)**:
  ```
  vite v8.2.0 building client environment for production...
  ✓ 2027 modules transformed.
  dist/assets/LandingPage-CpppFGcq.js                         63.55 kB │ gzip:  17.38 kB
  dist/assets/index-CPIDEEAz.js                              361.37 kB │ gzip: 114.88 kB
  ✓ built in 1.39s
  # [Output: Successful build output]
  ```
- **Local Dev Server**: Serves components correctly at `http://localhost:3000/`.

---

## 5. Options and Next Steps

The initialization foundation is complete. We can proceed to **Phase 3.2: Login Page & Authentication Integration**.

Key items to cover in the next step:
1. **Public Forms Setup**: Implement the custom Login form under `features/auth/pages/LoginPage.tsx` using `react-hook-form` and validation schemas from `schemas/auth.schemas.ts`.
2. **API Mapping**: Set up `/api/v1/auth/login` handling the standard OAuth2 `application/x-www-form-urlencoded` fields (`username` mapping to email, `password`).
3. **State Integration**: Wire login callbacks to `setAuth()` inside `AuthProvider` to update the access token, populate active session cookies/localStorage, fetch profile fields via `/api/v1/auth/me`, and redirect users to the dashboard.
4. **Forgot Password Flow**: Wire mock OTP fields and password updates inside `features/auth/` routes.
