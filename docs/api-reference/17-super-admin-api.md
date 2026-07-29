# Super Admin API

The Super Admin represents the highest level of administrative authorization in the Crowdsourced Civic Issue Reporting & Resolution System (CSCRS). Rather than having a dedicated endpoint namespace, the Super Admin role acts as a global administrative overlay that grants permission to modify system configurations, manage other administrative accounts, and configure global variables.

---

## Endpoint Summary

`No dedicated Super Admin API operations are registered in the current implementation.`

> [!NOTE]
> The Super Admin role does not expose a dedicated `/super-admin/...` API route namespace. Instead, the `UserRole.SUPER_ADMIN` type is mapped as a permission gate across various modular endpoint routers (such as City Admins, Workers, and System Configs).

---

## Super Admin Role

Verified properties of the Super Admin role in the codebase:
* **UserRole Enum Value:** Mapped under the core `UserRole.SUPER_ADMIN` enum value.
* **Authentication:** Uses the generic `/api/v1/auth/login` Bearer JWT token route. There is no separate login gateway.
* **Database Model:** Super Admins do not have a separate profile table or model. They are stored directly in the `users` table.
* **Global Scope:** Super Admins have `department_id = null` and are globally scoped, bypassing all department boundaries during lookups and administrative operations.

---

## Super Admin Administrative Authority

The Super Admin possesses cross-module authorization across the system. The following matrix traces their verified authority compared to other roles:

| Domain | Verified Authority | Canonical API Chapter |
| :--- | :--- | :--- |
| **Authentication** | Uses the standard login route; subject to the same login lockout (5 failed attempts → 30-minute lock) as all other roles. No bypass exists for Super Admin accounts. | [Authentication API](09-authentication-api.md) |
| **Profile Management** | Standard profile updates, avatar uploads, and password resets. | [Profile API](10-profile-api.md) |
| **Reports** | Read-only global visibility of civic issue reports. | [Reports API](11-reports-api.md) |
| **Assignments** | Can trigger manual workload-based assignments for reports. | [Assignments API](12-assignments-api.md) |
| **Resolutions** | Read-only visual inspection of resolution evidence; manual approval is handled by Department Admins. | [Resolutions API](13-resolutions-api.md) |
| **Worker Management** | Can invite/create new workers and deactivate/reactivate worker accounts. | [Workers API](14-workers-api.md) |
| **Dept Admin Management** | Invite/create new Department Admins across any department. | [Department Admin API](15-department-admin-api.md) |
| **City Admin Management** | Exclusive authority to invite/create and block/unblock City Admins. | [City Admin API](16-city-admin-api.md) |
| **Departments** | Full create, update, delete, and configure authority for municipal departments. | [Departments API](18-departments-api.md) |
| **Feedback** | Retrieve and review citizen feedback submissions; export in CSV/Excel format. | [Feedback API](23-feedback-api.md) |
| **System Issues** | Full management and status-update authority over reported system bugs/issues. | [System Issues API](24-system-issues-api.md) |
| **AI Dataset** | Exclusive authority to export operational datasets for offline ML training. | [AI Dataset API](25-ai-dataset-api.md) |

---

## Administrative Hierarchy

The administrative permission flow matches a strict role hierarchy:

```
      [Super Admin]
            ↓
       [City Admin]
            ↓
    [Department Admin]
            ↓
        [Worker]
```

* **Super Admin:** Global system owners who invite and manage City Admins and configure systemic parameters (departments, AI datasets, system issues).
* **City Admin:** Municipal coordinators who regulate citizens, department admins, and view cross-departmental dashboards.
* **Department Admin:** Operational directors who manage field technicians (workers), manual resolution approvals, and rework requests within their department.
* **Worker:** Field technicians who start tasks and submit visual evidence of issue resolutions.

---

## Super Admin Account Creation

* **No Provisioning Endpoint:** There is no public API endpoint or invite route for creating, promoting, or inviting users to the `SUPER_ADMIN` role.
* **Bootstrap Provisioning Script:** Initial Super Admin accounts are seeded directly in the database using the command-line bootstrap script:
  `scripts/bootstrap_super_admin.py`
* **Bootstrap Seed Details:**
  * Checks if user `superadmin@gmail.com` exists.
  * If absent, creates a `User` record with role `SUPER_ADMIN`.
  * Flags `is_active = True` and `is_email_verified = True`.
  * Sets the initial name to `"System Owner"` and assigns a default password hash.

---

## Super Admin Account Management

Super Admin accounts manage their own credentials, active states, and login profiles through the standard user routes:
* Retrieve active user details: `GET /api/v1/profile/me` (returns role `SUPER_ADMIN`).
* Update user details: `PATCH /api/v1/profile/me`.
* Configure passwords: standard profile password updates.
* **Idempotent Auth:** All session verifications map standard access and refresh tokens. Refer to [Authentication API Reference](09-authentication-api.md) and [Profile API Reference](10-profile-api.md) for endpoint contracts.
