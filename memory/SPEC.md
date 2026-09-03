# Barangay Health Center – Patient Profiling and Record Management System

## What the app does
Web system for a barangay (village) health center in the Philippines. Staff log in, profile
residents as patients, track pregnancies with prenatal visits, track babies/children with EPI
immunization records, log consultations (health records), and view dashboard analytics + reports.

## Stack
FastAPI + MongoDB (motor) backend on `/api`; Vite + React 19 + TS strict + Tailwind v4 +
shadcn (base-ui) frontend. TanStack Query for all reads/writes. Recharts for charts.

## Auth
- httpOnly cookie session (`bhc_session`), stored in `db.sessions`. Passwords are sha256-salted.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Roles: `administrator` (full access incl. user CRUD) and `health_worker` (all clinical CRUD,
  read-only on Users). `require_admin` guards user create/update/delete.
- Frontend: `useAuth()` hook reads `/auth/me`; `AppShell` redirects to `/login` when unauthenticated.
  Logout goes through `lib/session.ts` `endSession()` so the react-query cache is cleared.

## Data model (Mongo collections, string uuid4 `id` on every doc)
- `users` — full_name, username (lowercase, unique), password (hash), role, status, created_at
- `patients` — patient_id (`BHC-<year>-0001`), full_name, birth_date, sex, civil_status,
  contact_number, address, blood_type, occupation, philhealth_number, patient_type
  (`general|maternal|pediatric|senior`), registered_by, created_at. `age` is computed on read.
- `pregnancies` — patient_id, gravida, para, expected_due_date, last_menstrual_period,
  risk_type (`Normal|High Risk`), notes. Patient name/age/blood type hydrated on read.
- `prenatal_visits` — pregnancy_id, visit_date, pregnancy_week, notes, health_worker
- `children` — patient_id, mother_name, birth_weight, current_weight. Patient fields hydrated on read.
- `immunizations` — child_id, vaccine_name, date_given, administered_by
- `health_records` — record_id (`REC-<year>-0001`), patient_id, consultation_date,
  consultation_type, chief_complaint, diagnosis, treatment, notes, health_worker,
  patient_name/patient_code denormalized
- `sessions` — token, user_id

## Key endpoints
`/api/dashboard`, `/api/reports?start=&end=`, `/api/patients` (search/age_group/sex/patient_type/
page/page_size, returns `{items,total,page,pages}`), `/api/patients/{id}`, `/api/patients/{id}/records`,
`/api/records` (paged), `/api/pregnancies`, `/api/pregnancies/{id}/visits`, `/api/prenatal-visits`,
`/api/children`, `/api/children/{id}/immunizations`, `/api/immunizations`, `/api/users`.

## Routes / flows
`/login` → split-screen login with 1-click demo pills. `/dashboard` (4 stat cards, donut by age
group, area chart of consultations this month, recent consultations table, quick links),
`/patients` (search + age/sex/type filters + pagination + register/edit/delete),
`/patients/:id` (profile panel + Overview / Health Records / Visit History tabs + Edit Information),
`/maternal` (registry list + pregnancy info + prenatal visits table), `/pediatric` (child registry +
child info + immunization table), `/records` (CRUD + search + filter + pagination),
`/visits` (chronological consultation log), `/reports` (date range + Generate Report + bar/pie charts),
`/users` (admin CRUD + activate/deactivate), `/settings`.

## Seed
`cd /app/backend && python seed.py` — idempotent (skips if patients exist). Seeds 4 users,
12 patients, 3 pregnancies with prenatal visits, 3 children with immunizations, ~50 health
records spread over the last 45 days plus 3 guaranteed today.
