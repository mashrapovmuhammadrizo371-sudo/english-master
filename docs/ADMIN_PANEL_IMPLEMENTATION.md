# Admin Panel implementation

## Branch and preview
- Branch: `feature/admin-panel`
- Pull request: #11
- Preview: `https://feature-admin-panel.english-master-aow.pages.dev`
- Production `main` remains unchanged until the PR is approved and merged.

## Access and security
- The Pages Function at `functions/api/admin/[[path]].js` requires a Google ID token in the Authorization Bearer header.
- It delegates token validation and Super Admin recognition to the existing authentication Worker.
- Browser-provided role flags are never trusted. Delegated Admin permissions are checked server-side on each protected endpoint.
- Only Super Admin can grant or revoke delegated Admin access and change AI/payment settings.
- Administrative writes are recorded in the D1 audit log.

## D1
The existing `english-master-db` database is bound as `DB`. Existing user, course, lesson, assessment and learning-progress data is preserved. Admin tables include exams, exam questions, attempts, plans, payment transactions, audit logs, AI settings and payment settings. The schema is documented in `migrations/0001_admin_foundation.sql`.

## Implemented modules
- Dashboard: permission-scoped live counts.
- Students: latest 200 Google profiles.
- Courses & Lessons: list and create draft courses/lessons.
- Tests & Exams: create draft exams, add multiple-choice questions (2–6 options), view/remove draft questions, and publish an exam only after at least one question exists. Published test questions are locked from deletion.
- AI Management: Super Admin can enable/disable AI configuration, select an allow-listed OpenAI model, and save teacher instructions. No API key is accepted or returned by the browser; provider keys must be configured separately as Cloudflare Worker/Pages secrets. This stores the admin configuration; it does not by itself connect a model runtime.
- Payments & Plans: view recorded transactions, create draft plans, and set provider metadata with payments disabled or in test mode. Real charges, refunds, checkout, provider webhooks and live merchant credentials are deliberately not enabled.
- Settings & Security: grant/revoke delegated Admin permissions and view audit events.

## Verification and known limits
- Cloudflare preview deployment/build must be checked after the latest branch commit.
- Authenticated end-to-end tests require the owner's own Google session. The Super Admin and delegated Admin roles must be tested separately in the preview; no credentials or tokens should be shared in chat.
- A real payment provider requires an approved merchant account, server-side signature/webhook verification, refund policy and adult/legal review before any live transaction flow is enabled.
- AI inference requires a separately configured server-side provider secret and a runtime integration. The Admin UI does not expose secrets.
- Production `main` and the production site are not changed by this branch until the PR is merged.
