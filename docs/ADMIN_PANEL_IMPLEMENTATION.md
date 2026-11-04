# Admin Panel implementation

## Branch and preview
- Branch: `feature/admin-panel`
- Pull request: #11
- Preview: `https://feature-admin-panel.english-master-aow.pages.dev`
- Production `main` is unchanged.

## Access and security
- The Pages Function at `functions/api/admin/[[path]].js` requires a Google ID token in the Authorization Bearer header.
- It delegates token validation and Super Admin recognition to the existing `english-master-auth` Worker. That Worker validates Google issuer, audience, expiry and verified email, and derives `isAdmin` from its server-side `ADMIN_EMAIL` secret.
- The Pages Function never trusts a browser-provided role flag. It checks delegated Admin permissions against D1 for every protected endpoint.
- Only the Super Admin can grant or revoke delegated Admin permissions.
- Admin write actions create audit-log records.

## D1 database
The existing `english-master-db` database is bound as `DB` for Pages Functions. The existing `users`, `admin_roles`, `courses` and `lessons` tables were retained. Missing tables for exams, exam questions, attempts, plans, payment transactions and audit logs were added using idempotent CREATE TABLE statements. Existing assessment and learning-progress tables were preserved.

The matching schema is documented in `migrations/0001_admin_foundation.sql`. All statements use `IF NOT EXISTS` so the migration can be safely reconciled with the existing database.

## Working modules
- Dashboard reads permission-scoped counts from D1.
- Students lists the latest 200 registered Google profiles.
- Courses lists courses, creates draft courses, lists lessons, and creates draft lessons.
- Tests lists exams and creates draft exam records.
- Payments lists recorded transactions and lets the Super Admin create draft plan records. No real payment processing or refunds are enabled.
- Settings & Security lets the Super Admin grant/revoke delegated Admin roles and view the latest audit events.
- AI Management remains a safe placeholder; model secrets are not exposed in the browser.

## Remaining before production merge
1. Add question-authoring and exam publishing workflows.
2. Add plan publishing and a vetted payment-provider integration before accepting or refunding money.
3. Add AI configuration through server-side secrets and permission checks.
4. Run a complete authenticated end-to-end test with the Super Admin account and a limited Admin account.
5. Confirm production deployment settings before merging the PR.
