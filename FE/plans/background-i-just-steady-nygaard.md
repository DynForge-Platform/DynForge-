# Gradora — Full i18n Rebuild to JSON + nested t() keys (Phase 3)

## Context
The app currently has a working but incomplete translation system: `useLanguage()` returns a flat `T` object sourced from `src/app/i18n/translations.ts` (TS file, 330 flat keys, EN/VI parity). Only ~14 of 41 pages use it — the entire admin section, most teacher pages, and several dashboard pages still contain ~100+ hardcoded English strings, causing mixed-language UI when Vietnamese is selected.

**User decision:** Rebuild the i18n architecture entirely to JSON locale files with nested namespaced keys accessed via a `t('namespace.key')` function — migrating ALL files (including the 14 already working) so the whole app uses one consistent pattern with **100% translation coverage** and zero hardcoded user-visible text.

## Goal
- `/src/app/locales/en.json` and `/src/app/locales/vi.json` hold every visible string, organized by namespace.
- A `t('nav.findMentors')`-style function replaces both hardcoded text and the old `T.flatKey` usage everywhere.
- Switching language re-renders the whole app (already works via context) and yields 100% Vietnamese with no English leakage.

## Step 1 — Build the new i18n core
- Create `src/app/locales/en.json` + `src/app/locales/vi.json` with **nested namespaces**: `common`, `nav`, `auth`, `home`, `mentor`, `mentorList`, `booking`, `order`, `payment`, `escrow`, `wallet`, `dashboard`, `disputes`, `profile`, `settings`, `messages`, `support`, `resources`, `about`, `becomeMentor`, `teacher`, `admin`, `footer`, `errors`, `roles`, `status`, `vouchers`. Migrate all 330 existing keys from `translations.ts` into the appropriate namespaces, then ADD keys for every hardcoded string found in the audit.
- Rewrite `src/app/context/LanguageContext.tsx`: keep `lang`/`setLang`/localStorage, but expose **`t(path, vars?)`** — a lookup that walks the dot-path into the active locale JSON and supports `{var}` interpolation (replacing the old function-valued keys like `mentorsFound(n)`). Keep a deprecated `T` proxy temporarily ONLY if needed; preferred end state is `t()` only.
- Keep `useLanguage()` returning `{ lang, setLang, t }`. Optionally add a `useTranslation()` alias that returns `{ t }` to match the spec's wording.

## Step 2 — Migrate every component/page (no hardcoded text remains)
Apply the same pattern to all files. For each: import `useLanguage`/`useTranslation`, replace literal JSX text, `placeholder`, `title`, `label`, `alt` (user-facing), `aria-label`, and all `toast.*` messages with `t('ns.key')`.

Representative files (full list is all of `src/app/pages/**` + `src/app/components/**`):
- **Already on old system → convert `T.x` → `t('ns.x')`:** `Home.tsx`, `Auth.tsx`, `About.tsx`, `Resources.tsx`, `BecomeMentor.tsx`, `MentorListing.tsx`, `MentorProfile.tsx`, `ScheduleConsultation.tsx`, `OrderSummary.tsx`, `EscrowStatus.tsx`, `StudentDashboard.tsx`, `ErrorPages.tsx`, `DashboardWallet.tsx`, `components/layouts/Header.tsx`, `Footer.tsx`, `DashboardLayout.tsx`, `MentorCard.tsx`, `common.tsx`.
- **Worst offenders (no i18n yet):** all 9 `pages/admin/*`, teacher pages (`TeacherWallet`, `TeacherEarnings`, `TeacherDisputes`, `TeacherSessions`, `TeacherProfile`, `TeacherVerification`, `TeacherSettings`, `TeacherAvailability`, `MentorWithdraw`, `MentorVouchers`), `dashboard/DashboardDisputes`, `DashboardProfile`, `DashboardSettings`, `Messages.tsx`, `ContactSupport.tsx`, `AdminDashboard.tsx`.
- **Arrays of literals** (e.g. `tabs`, `declineReasons`, `issueTypes`, `certTypes`, `baseDocuments`, `categories`) must be moved into locale JSON or mapped through `t()` at render time — never rendered as raw English.
- **Status/role values** that are also data keys (e.g. `'Pending'`, `'Senior Student'`) stay as internal values but are displayed via a `t('status.pending')` / `t('roles.seniorStudent')` lookup map (the `StatusBadge` and `MentorCard` already hint at this pattern).

## Step 3 — Localization audit / guardrail
- After migration, grep for residual hardcoded text patterns to prove coverage: search `src/app` for JSX text, `placeholder="`, `toast.success('`, etc. with Latin letters not wrapped in `t(`. Fix any hits.
- Ensure `en.json` and `vi.json` have identical key sets (no missing keys → no English fallback leaking into VI).

## Critical files
- New: `src/app/locales/en.json`, `src/app/locales/vi.json`
- Rewritten: `src/app/context/LanguageContext.tsx`
- Removed/emptied: `src/app/i18n/translations.ts` (after migration)
- Touched: every file under `src/app/pages/**` and `src/app/components/**` that renders text.

## Verification
- App runs on the existing Vite dev server. Use the make:run / preview surface.
- Toggle the language switcher to **Tiếng Việt** and walk through: Home, Find Mentors, Mentor Profile, Booking → Order → Escrow, Messages, Support, Student dashboard (Sessions/Wallet/Disputes/Profile/Settings), Mentor portal (all pages incl. Wallet/Earnings/Vouchers/Verification), Admin (all pages), Footer + partnership modal. Confirm **zero English** appears anywhere, including toasts, table headers, empty states, dialogs, placeholders, and validation messages.
- Switch back to English and confirm parity.
- Run the grep guardrail from Step 3 → expect no matches.
- Confirm no console errors for missing translation keys.

---

# Gradora — Full Platform Expansion (Phase 2)

## Context
Phase 1 built the 12 core Gradora pages. Phase 2 expands the platform to a complete production-quality marketplace with three distinct role portals (Student, Teacher, Admin), all previously missing sub-routes, error pages, and richer mock data — driven by the full spec in `src/imports/pasted_text/user-wallet.tsx`. The result should feel like a funded startup, not a prototype.

**Constraints (unchanged):** VND-only currency via `formatCurrency`, Sora headings / Inter body, royal-blue `#2547F0` primary, reuse all existing shadcn/ui primitives and existing common components.

---

## Step 1 — Expand mock data (`src/app/data/mockData.ts`)
Add new entities needed by the new pages:
- `Dispute` interface + 4 mock disputes (Open, Under Review, Resolved, Refunded).
- `WalletTransaction` interface with fields: `id`, `date`, `type` (Paid | In Escrow | Refunded | Failed), `mentor`, `course`, `amount`, `method`, `status` + 6–8 mock rows.
- `TeacherSession` (extend or alias `Session`) — add `studentName`, `studentAvatar`, `sessionStatus` (Pending | Upcoming | Completed | Cancelled).
- `AuditLog` interface: `id`, `action`, `actor`, `target`, `timestamp`, `status` + 6 rows.
- `AdminUser` interface: `id`, `name`, `email`, `role`, `university`, `status`, `joined` + 8 rows.
- Wallet balance/escrow constants for student and teacher.
- Keep `formatCurrency`, `getMentor`, all existing data untouched.

---

## Step 2 — New shared layout: `TeacherLayout` (`src/app/components/layouts/DashboardLayout.tsx`)
Update `DashboardLayout` to accept `role: 'student' | 'teacher' | 'admin'` (instead of the current `admin: boolean` flag). Render the correct sidebar menu per role:
- **student**: My Sessions, Wallet / Transactions, Disputes / Complaints, Profile, Settings  
- **teacher**: Teaching Dashboard, My Sessions, Calendar, Availability, Earnings, Wallet / Payouts, Disputes, Profile, Verification, Settings  
- **admin**: Dashboard, Users, Mentors, Mentor Verification, Transactions, Commission / Revenue, Payouts, Disputes, Resources, Reports, Settings, Audit Logs, Logout

Keep the same visual layout — sticky sidebar + top bar with avatar.

---

## Step 3 — Error pages (`src/app/pages/ErrorPages.tsx`)
One file exporting:
- `NotFoundPage` — 404 hero with GraduationCap icon, "Page not found", Go to Dashboard / Back to Home / Contact Support buttons.
- `PermissionDeniedPage` — ShieldX icon, explains role-based access, CTA: Go back to dashboard.
Wire `path="*"` → `NotFoundPage` at the bottom of the router in App.tsx. Add an `errorElement` on the root route that renders a polished Gradora error card instead of the white-screen crash page.

---

## Step 4 — Student sub-pages (4 new files)

### `src/app/pages/dashboard/DashboardWallet.tsx`
- KPI row: Available Balance | Held in Escrow | Total Spent | Refunded Amount  
- Main wallet card with balance (e.g. 500,000₫), Add Funds button, disabled Withdraw  
- Active escrow list (pull `sessions` where `status === 'In Escrow'` — mentor name, date, amount, View Session link)  
- Transaction history table with tabs (All / Paid / In Escrow / Refunded / Failed) using `WalletTransaction[]`, columns: Date, Type badge, Mentor, Course, Amount, Method, Status, Receipt action  

### `src/app/pages/dashboard/DashboardDisputes.tsx`
- KPI row: Open | Under Review | Resolved | Refunded  
- "Open New Dispute" button (opens a Dialog/sheet — form with session selector, issue type, description)  
- Dispute table: Case ID, Session, Mentor, Issue Type, Created Date, Status badge, View action  
- Empty state from `EmptyState` when no disputes  
- Dispute detail modal/drawer showing timeline, student reason, admin decision placeholder  

### `src/app/pages/dashboard/DashboardProfile.tsx`
- Profile completion progress bar (Progress component)  
- Avatar placeholder with camera icon overlay  
- Two-column form: Personal info (name, email, university email, phone, university, major, academic level)  
- Learning preferences section (subjects multi-select badges, preferred mode, language, online/offline toggle)  
- Security section (Change password link, Google connection, 2FA placeholder toggle)  
- Save Changes primary button  

### `src/app/pages/dashboard/DashboardSettings.tsx`
- Accordion/card sections: Account, Notifications (toggles), Payment preferences (default method), Privacy, Delete Account (danger zone)  
- Use Switch component for notification toggles  

---

## Step 5 — Teacher portal (10 new files under `src/app/pages/teacher/`)

### `TeacherDashboard.tsx`
- Welcome + verification status badge card (approved/pending)  
- KPI: Upcoming | Completed | Total Earnings | Rating | Response Rate  
- "Today's schedule" list (next 3 sessions)  
- "Pending requests" list  
- Recent reviews (reuse `ReviewCard`)  
- CTA: Update Availability  

### `TeacherSessions.tsx`
- Tabs: All / Pending / Upcoming / Completed / Cancelled  
- Table: Student, Course, Date & Time, Mode, Format, Payment Status, Session Status, Action  
- Actions per status: Accept, Decline, Join Session, Mark Completed, Respond to Dispute  

### `TeacherCalendar.tsx`
- Monthly calendar (same UI pattern as `ScheduleConsultation` calendar, but teacher-facing)  
- Color-coded day cells: booked (primary), available (success), unavailable (muted)  
- Weekly mini-schedule below: list upcoming sessions by day  

### `TeacherAvailability.tsx`
- Weekly editor (7 columns, time rows 08:00–20:00, toggle slots on/off)  
- Buffer time setting (Select: 0 / 15 / 30 min)  
- Max sessions per day (Select: 1–8)  
- Format toggle: Online / Offline / Both  
- Save availability button  

### `TeacherEarnings.tsx`
- KPI: Total Earnings | Pending Payout | Available for Withdrawal | Platform Fees  
- `recharts` AreaChart for monthly earnings (reuse `revenueTrend` data pattern)  
- Session earnings table: Session ID, Student, Date, Amount, Commission, Net  
- Payout history table: Date, Amount, Method, Status  
- Withdraw button  

### `TeacherWallet.tsx`
- Available balance card + Withdraw button  
- Pending escrow release list  
- Bank account section (placeholder)  
- Transaction table  

### `TeacherDisputes.tsx`
- Same layout as `DashboardDisputes` but from teacher's perspective — "Student claim" and "Respond" button  

### `TeacherProfile.tsx`
- Mentor profile editor mirroring `MentorProfile` sections but editable  
- Hourly rate input, headline input, about textarea, courses input, avatar upload placeholder  
- Preview / Save buttons  

### `TeacherVerification.tsx`
- 5-step `StepProgress`: Basic info → University email → Transcript upload → Interview → Approved  
- Document upload cards (drag-and-drop placeholder)  
- Verification status + notes  

### `TeacherDashboardLayout.tsx` (reuse `DashboardLayout` with `role="teacher"`)
No new file needed — wire with `<DashboardLayout role="teacher">`.

---

## Step 6 — Admin sub-pages (8 new files under `src/app/pages/admin/`)

### `AdminOverview.tsx` (route: `/admin`)
- KPI: Total Users | Active Mentors | Total Revenue | Commission | Pending Payouts | Open Disputes  
- Revenue chart + recent signups + recent transactions tables side by side  
- Pending verifications list  

### `AdminUsers.tsx`
- Search + filter by role  
- Table: Name, Email, Role badge, University, Status badge, Joined date, View/Suspend/Change Role actions  

### `AdminMentors.tsx`
- Mentor list with verification status, rating, sessions, earnings, Approve/Suspend  

### `AdminVerification.tsx`
- Pending applications table: applicant name, university, submitted date, status  
- Detail card (expandable): documents, course expertise, interview status, Approve / Reject / Request Info  

### `AdminTransactions.tsx`
- Full transaction table reusing existing `transactions[]` + `WalletTransaction[]` with additional columns: Escrow Status, Platform Fee, Action (view receipt)  

### `AdminPayouts.tsx`
- Pending payouts table: Teacher, Amount, Method, Sessions count, Risk status, Process action  
- Bulk process button  

### `AdminDisputes.tsx`
- Dispute queue with Priority column, detail panel/drawer with timeline and decision form  

### `AdminAuditLogs.tsx`
- Audit log table using `AuditLog[]`: Action, Actor, Target, Timestamp, Status  

*(Commission & Revenue, Resources, Reports, Settings admin pages already partially exist or are lower priority — wire with placeholder stubs if time allows.)*

---

## Step 7 — Wire all routes in `src/app/App.tsx`
```
/dashboard               → StudentDashboard
/dashboard/wallet        → DashboardWallet
/dashboard/disputes      → DashboardDisputes
/dashboard/profile       → DashboardProfile
/dashboard/settings      → DashboardSettings

/teacher                 → TeacherDashboard
/teacher/sessions        → TeacherSessions
/teacher/calendar        → TeacherCalendar
/teacher/availability    → TeacherAvailability
/teacher/earnings        → TeacherEarnings
/teacher/wallet          → TeacherWallet
/teacher/disputes        → TeacherDisputes
/teacher/profile         → TeacherProfile
/teacher/verification    → TeacherVerification

/admin                   → AdminOverview
/admin/users             → AdminUsers
/admin/mentors           → AdminMentors
/admin/verification      → AdminVerification
/admin/transactions      → AdminTransactions
/admin/payouts           → AdminPayouts
/admin/disputes          → AdminDisputes
/admin/audit             → AdminAuditLogs

*                        → NotFoundPage
```

---

## Consistency rules (unchanged + additions)
- All ₫ values through `formatCurrency()`.
- Correct session durations (90 min session = 90 min, not 180).
- `StatusBadge` covers all new statuses: Open, Under Review, Resolved, Refunded, Pending, Approved, Rejected, Suspended.
- `EmptyState` component for all empty list states.
- `KpiCard` reused for all metric summaries.

---

## Verification
- Navigate: `/dashboard` → click Wallet, Disputes, Profile, Settings in sidebar — no 404.
- Navigate: `/teacher` → click all sidebar items — no 404.
- Navigate: `/admin` → click all sidebar items — no 404.
- Navigate to `/some-bad-url` → see polished 404 page, not browser 404.
- All money values render in ₫; session durations are integer minutes matching the difference between start and end times.
