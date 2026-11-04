# Admin Panel implementation notes

## Current branch
The `feature/admin-panel` branch adds a responsive Admin Console interface and a gated route in the React app.

## Access model
- The existing authentication Worker validates Google ID tokens server-side.
- The existing `ADMIN_EMAIL` Worker secret is the bootstrap Super Admin identity.
- Browser-provided flags must never be treated as authorization. All future admin API routes must independently verify the Google token and resolve roles from server-side data.
- Future delegated administrators belong in `admin_roles` with explicit permissions. Only the Super Admin may grant or revoke those roles.
- Every write operation must create an audit-log entry.

## Data foundation
`migrations/0001_admin_foundation.sql` defines the initial D1 schema for users, delegated admin roles, courses, lessons, exams, attempts, plans, payments, and audit logs.

## Not yet connected
The current Admin Console is an interface scaffold. It deliberately displays empty states instead of fabricated counts. It does not yet read or write D1 records, create courses, publish tests, manage admins, or process payments/refunds.

## Required before production activation
1. Confirm the production D1 database and inspect its existing tables before applying the migration.
2. Update the authentication Worker to use the migration and return a server-derived role.
3. Implement authenticated, permission-checked API endpoints for each module.
4. Add audit logging and CSRF/origin protections for state-changing endpoints.
5. Integrate a payment provider and reconciliation process before enabling payment or refund actions.
6. Run production build and end-to-end authorization tests for Super Admin, delegated Admin, and ordinary student accounts.
