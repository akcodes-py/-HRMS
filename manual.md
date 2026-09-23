# HRMS — Engineering Manual

Internal documentation for the Human Resource Management System. Written for
the engineer who inherits this codebase. Covers what the system does, why it
is shaped the way it is, and how to run, test, and deploy it.

## 1. System overview

HRMS is an internal HR admin system for a mid-sized company. It manages
employees, daily attendance, and leave requests through a Django REST API with
a React (Vite) frontend.

There are two user roles:

- **Admin (HR).** Full access. Creates user accounts, manages employee
  records, marks and corrects attendance, reviews leave requests, and sees
  company-wide dashboards (headcount, today's attendance, pending leaves).
- **Employee.** Self-service only. Views their own profile, their own
  attendance history and monthly summary, and applies for / tracks their own
  leave requests. Employees cannot see other employees' records and cannot
  create accounts or approve leaves.

Authentication is JWT (access + refresh), issued by the backend and stored by
the frontend in `localStorage` (`hrms_tokens`, `hrms_user`). The access token
is sent as `Authorization: Bearer <token>` on every API call and silently
refreshed on 401. There is no self-registration: only admins can create
accounts, via `POST /api/accounts/register/`.

The project is structured as a monorepo: `backend/` (Django + DRF) and
`frontend/` (React + Vite). SQLite is used for local development (zero
setup); PostgreSQL via `DATABASE_URL` for production. Deployment target is
Railway with Gunicorn. CI is lint/test only; deploys are manual.

## 2. Architecture decisions

**App split: `accounts`, `employees`, `attendance`, `leaves`.** Each app owns
one domain (auth/users, employee records, attendance, leave). This mirrors how
HR thinks about the system and keeps models, serializers, views, and tests
co-located per domain. `departments` was deliberately not made a separate app
or table: the company has a small, stable set of departments, so
`Employee.department` is a `choices` field. Promote it to a `Department` model
with a foreign key if departments need managers, budgets, or headcount
planning — that day has not come yet.

**Viewsets, consistently.** All domain endpoints are DRF `ModelViewSet`s
registered on a single `DefaultRouter` in `config/urls.py`. One pattern
everywhere: queryset filtering in `get_queryset()`, serializer selection in
`get_serializer_class()` where needed, role checks in `get_permissions()`.
Do not add ad hoc function-based views for domain logic; add an `@action` or
a new viewset method.

**Permissions, not if-checks.** Role enforcement lives in
`accounts/permissions.py` (`IsAdminRole`, `IsOwnerOrAdmin`,
`IsAdminOrReadOnly`) and in each viewset's `get_permissions()`. Views never
branch on `request.user.role` to decide access — except for *scoping* (an
employee's queryset is filtered to their own records). One known trap, fixed
on this branch: `get_permissions()` overrides any `permission_classes` passed
to `@action`, so **all role rules must be listed in `get_permissions()`**.
Do not put `permission_classes=` on `@action` decorators; it is silently
ignored.

**Services layer.** Business logic that answers a business question lives in
`<app>/services.py`, not in views or serializers:

- `employees/services.py` — headcount aggregates, department breakdown,
  `get_employee_for_user()`.
- `attendance/services.py` — `monthly_summary()`, `today_summary()`.
- `leaves/services.py` — `approve_leave()`, `reject_leave()`, which enforce
  the "only pending leaves transition" invariant in one place. Views call
  these and translate `ValidationError` into 400s automatically.

Serializers own *input shape and field-level validation* (salary >= 0, no
future joining dates, check-out after check-in, end date on/after start date,
90-day single-request cap). Anything involving two objects or a state
transition goes in services.

**JWT for a React SPA.** `djangorestframework-simplejwt` with 60-minute access
and 7-day rotating refresh tokens (blacklisted after rotation via the
`token_blacklist` app). Chosen over session auth because the frontend is a
separate Vite app talking JSON, and token auth keeps the API stateless and
Railway-friendly (no sticky sessions, no CSRF on API calls). Logout
blacklists the refresh token.

**Frontend: boring admin panel, on purpose.** Dense tables, plain forms,
borders instead of shadows, slate/white with indigo reserved for primary
actions and status. No gradients, no glassmorphism, no illustrations. The UI
is optimized for an HR operator using it all day: scanable rows, consistent
filter bars, explicit empty/loading/error states. Do not add marketing
styling; it will be removed in review.

## 3. Setup instructions

Prerequisites: Python 3.10+, Node 18+, Git.

```bash
git clone https://github.com/akcodes-py/-HRMS.git
cd -HRMS
cp .env.example .env   # then fill in SECRET_KEY at minimum
```

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # create an admin; set role=admin
python manage.py runserver
```

The `createsuperuser` command creates a `CustomUser`. Give it `role=admin`
(either when prompted by a custom prompt, or afterwards via the Django admin
or shell) or it will default to `employee` and be unable to manage records.
Then log in through the frontend or `POST /api/token/` to get JWTs.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend runs at `http://localhost:8000`, frontend at
`http://localhost:5173`. Vite proxies `/api` and `/media` to the backend in
dev, so no frontend env vars are needed locally.

Environment variables (see `.env.example` for the full template):

| Variable | Where | Purpose |
|---|---|---|
| `SECRET_KEY` | backend | Django secret key. Required in production. |
| `DEBUG` | backend | `True` locally, `False` on Railway. |
| `ALLOWED_HOSTS` | backend | Comma-separated. Railway domain in production. |
| `DATABASE_URL` | backend | Unset locally (SQLite). Railway injects Postgres URL. |
| `CORS_ALLOWED_ORIGINS` | backend | Comma-separated frontend origins. |
| `CSRF_TRUSTED_ORIGINS` | backend | Production frontend origin(s), comma-separated. |
| `SECURE_SSL_REDIRECT` | backend | Defaults True when `DEBUG=False`. Set False only if TLS terminates elsewhere. |
| `VITE_API_BASE_URL` | frontend | Unset locally (Vite proxy). In production, the public backend URL *including* `/api`, e.g. `https://<app>.up.railway.app/api`. |

## 4. Project structure

```
-HRMS/
├── backend/
│   ├── config/            # settings, root urls, wsgi/asgi
│   │   ├── settings.py    # env-driven; SQLite dev / DATABASE_URL prod
│   │   ├── urls.py        # router + JWT + accounts + health check
│   │   └── tests.py       # health-check test
│   ├── accounts/          # CustomUser (role admin/employee), JWT-adjacent
│   │                       # endpoints, permission classes
│   │   ├── models.py      # CustomUser with role, phone, department
│   │   ├── permissions.py # IsAdminRole, IsOwnerOrAdmin, IsAdminOrReadOnly
│   │   ├── serializers.py # User, Register, Update, ChangePassword
│   │   ├── views.py       # register/me/logout/change-password/users
│   │   └── tests.py
│   ├── employees/         # Employee records (department is a choices field)
│   │   ├── models.py      # Employee + employee_id generation
│   │   ├── serializers.py # list (light) vs detail (full) serializers
│   │   ├── services.py    # stats, breakdown, get_employee_for_user
│   │   ├── views.py       # CRUD + stats + my-profile
│   │   └── tests.py
│   ├── attendance/        # Daily per-employee status records
│   │   ├── models.py      # unique (employee, date)
│   │   ├── services.py    # monthly_summary, today_summary
│   │   └── tests.py
│   ├── leaves/            # Leave requests with approve/reject workflow
│   │   ├── models.py      # type, dates, status, reviewer audit fields
│   │   ├── services.py    # approve_leave, reject_leave
│   │   └── tests.py
│   ├── requirements.txt   # pinned; includes ruff for CI lint
│   └── pyproject.toml     # ruff config (E,F; line-length 120)
├── frontend/
│   ├── src/
│   │   ├── components/    # DataTable, Modal, StatusBadge, Navbar, Sidebar…
│   │   ├── context/       # AuthContext (tokens, user, login/logout)
│   │   ├── hooks/         # useAuth re-export, usePagination, useToast
│   │   ├── layouts/       # DashboardLayout, AuthLayout
│   │   ├── pages/         # dashboard, employees, attendance, leaves, profile, auth
│   │   ├── routes/        # AppRoutes with ProtectedRoute + adminOnly
│   │   └── services/      # api (axios + refresh) + per-domain services
│   └── eslint.config.js   # eslint; v7 set-state rules off (see §7/§9)
├── .github/workflows/ci.yml
├── .env.example
├── manual.md              # this file
└── railway.json           # Railway start command (backend/Gunicorn)
```

`backend/Procfile` (`web: gunicorn …`) is a leftover from a Heroku-style
setup and is not used by Railway; `railway.json` is the source of truth for
the start command. It was left in place to avoid breaking anyone who still
references it.

## 5. API reference

Base URL `http://localhost:8000`. Auth: `Authorization: Bearer <access>`
unless noted. Paginated list responses are `{count, next, previous,
results}` (page size 10).

**Auth (SimpleJWT):**

| Method | Path | Auth | Body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/token/` | no | `{username, password}` | `{access, refresh}` | Login. |
| POST | `/api/token/refresh/` | no | `{refresh}` | `{access, refresh?}` | Rotation enabled; new refresh blacklists old. |
| POST | `/api/token/verify/` | no | `{token}` | `{}` | Token validity check. |

**Accounts** (`/api/accounts/`):

| Method | Path | Auth | Permissions | Body | Response |
|---|---|---|---|---|---|
| POST | `/register/` | yes | admin | `{username, email, first_name, last_name, password, password2, role}` | 201 created user. 400 on password mismatch. |
| GET | `/me/` | yes | any authenticated | — | Current user object. |
| PATCH | `/me/` | yes | self | `{first_name, last_name, phone, profile_picture, department}` | Updated user. |
| POST | `/logout/` | yes | any | `{refresh}` | 200 blacklists token. 400 if missing/invalid. |
| POST | `/change-password/` | yes | self | `{old_password, new_password, new_password2}` | 200 on success. 400 on wrong old or mismatch. |
| GET | `/users/` | yes | admin | — | All users, newest first. |

**Employees** (`/api/employees/`):

| Method | Path | Permissions | Query params | Notes |
|---|---|---|---|---|
| GET | `/` | any auth | `search, department, status, ordering, page` | Search covers name/email/ID/department/designation. |
| POST | `/` | admin | — | `salary` >= 0, `joining_date` not future. Returns generated `employee_id` (`EMP0001`…). |
| GET | `/{id}/` | any auth | — | Full serializer with nested `user_data`. |
| PATCH/PUT | `/{id}/` | admin | — | Partial update supported. |
| DELETE | `/{id}/` | admin | — | Hard delete. |
| GET | `/stats/` | admin | — | `{total, active, inactive, terminated, on_leave, department_breakdown}`. |
| GET | `/my-profile/` | any auth | — | Employee linked to caller. 404 if unlinked. |

**Attendance** (`/api/attendance/`):

| Method | Path | Permissions | Query params | Notes |
|---|---|---|---|---|
| GET | `/` | any auth | `employee, date, month, year, status, search, ordering` | Employees are scoped to their own records server-side; `employee` filter is effectively admin-only. |
| POST | `/` | any auth | — | `{employee, date, status, check_in?, check_out?, remarks?}`. Duplicate (employee, date) → 400. Future dates → 400. check-out must be after check-in. |
| PATCH | `/{id}/` | admin | — | Corrections (e.g. wrong status). |
| DELETE | `/{id}/` | admin | — | — |
| GET | `/monthly-summary/` | any auth | `month, year, employee?` | `{month, year, present, absent, wfh, half_day, total}`. Non-admins get their own scope. |
| GET | `/today/` | admin | — | `{date, present, absent, wfh, half_day, total_active_employees, not_marked}`. |

Status values: `present`, `absent`, `wfh`, `half_day`.

**Leaves** (`/api/leaves/`):

| Method | Path | Permissions | Query params | Notes |
|---|---|---|---|---|
| GET | `/` | any auth | `employee, status, leave_type, search` | Employees scoped to own requests. |
| POST | `/` | any auth | — | `{employee, leave_type, start_date, end_date, reason}`. `status` is read-only (always `pending`). end < start → 400. > 90 days → 400. Reason < 5 chars → 400. |
| PATCH | `/{id}/` | any auth (own scope) | — | Edit own pending request. `status/reviewed_*` are read-only. |
| DELETE | `/{id}/` | admin | — | — |
| POST | `/{id}/approve/` | admin | — | pending → approved, stamps reviewer + time. Non-pending → 400. |
| POST | `/{id}/reject/` | admin | — | Body `{rejection_reason?}`. pending → rejected. Non-pending → 400. |
| GET | `/pending-count/` | admin | — | `{pending_count}`. |
| GET | `/summary/` | admin | — | 5 most recent pending requests (dashboard feed). |

Leave types: `sick`, `casual`, `annual`, `other`. Statuses: `pending`,
`approved`, `rejected`. `duration` (inclusive days) is a read-only derived
field.

**Misc:**

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/health/` | no | `{"status": "ok"}`. Liveness probe for Railway. |

## 6. Data model

- **CustomUser** (`accounts`). Extends `AbstractUser`. Adds `role`
  (`admin`/`employee`, default `employee`), `phone`, `profile_picture`,
  `department` (free-text mirror, not the employee record). One user has at
  most one employee profile.
- **Employee** (`employees`). `employee_id` (`EMP0001`…; generated from the
  row's own pk after first insert — race-safe, nullable until set),
  `user` (nullable OneToOne → CustomUser, `SET_NULL` on delete so removing a
  login does not delete the HR record), `first_name/last_name/email`
  (email unique), `phone`, `department` (choices, not FK — see §2),
  `designation`, `joining_date`, `salary`, `employment_status`
  (`active/inactive/terminated/on_leave`), `profile_picture`, `address`,
  timestamps. Ordered newest-first. Related: `attendance_records`,
  `leaves`, `employee_profile` (reverse from user).
- **Attendance** (`attendance`). `(employee FK CASCADE, date, status,
  check_in?, check_out?, remarks?)`. `unique_together (employee, date)`.
  Cascade: deleting an employee deletes their attendance history — intended
  (records belong to the employment, not the person; keep terminations as
  `employment_status=terminated` instead of deleting rows).
- **Leave** (`leaves`). `(employee FK CASCADE, leave_type, start_date,
  end_date, reason, status=pending, applied_on, reviewed_by FK→CustomUser
  SET_NULL, reviewed_on?, rejection_reason)`. `duration` is a Python property
  (inclusive days), exposed read-only in the API. Reviewer audit trail is
  kept: who approved/rejected and when.

Entity relationships: `CustomUser 1—0..1 Employee 1—* Attendance`,
`Employee 1—* Leave`, `CustomUser 1—* Leave (as reviewer)`.

## 7. CI/CD

Workflow: `.github/workflows/ci.yml`. Runs on every push and every PR
targeting `main`. Two jobs, both must pass:

- **Backend** (`backend/`): Python 3.11, `pip install -r requirements.txt`,
  `ruff check .` (config in `backend/pyproject.toml`: pycodestyle + pyflakes,
  line-length 120, migrations excluded), then
  `python manage.py test --verbosity 1` (Django runner, 44 tests across
  accounts/employees/attendance/leaves/health).
- **Frontend** (`frontend/`): Node 20, `npm ci`, `npm run lint` (eslint;
  errors fail, warnings do not), `npm run build` (vite production build —
  catches broken imports and syntax).

No auto-deploy. Railway deployment stays manual (see §8). A red CI run blocks
merge by policy: open the failed run, expand the failing step
(`Lint (ruff)`, `Run tests`, `Lint (eslint)`, `Build (vite)`), read the first
error — backend tracebacks point at `backend/<app>/tests.py` lines, eslint
prints file:line, vite prints the failing module. Fix, push, CI re-runs.

Eslint note: `react-hooks/set-state-in-effect` and `react-hooks/immutability`
(from plugin v7) are disabled in `eslint.config.js` with a comment. They flag
the standard fetch-in-`useEffect` list pattern used on every page. If that
plugin is upgraded or the data layer moves to React Query/SWR, revisit.

## 8. Deployment notes (Railway)

Railway builds with Nixpacks and starts the backend via `railway.json`:

```
cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Checklist for the Railway project:

1. Add the PostgreSQL plugin. `DATABASE_URL` is injected automatically;
   `settings.py` picks it up (with `conn_max_age=600`, SSL required when
   `DEBUG=False`). No code change needed.
2. Set variables: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS` (backend
   domain), `CORS_ALLOWED_ORIGINS` (frontend origin), `CSRF_TRUSTED_ORIGINS`
   (frontend origin, `https://…` form), keep `SECURE_SSL_REDIRECT=True`
   (Railway terminates TLS and sets `X-Forwarded-Proto`).
3. Run migrations on deploy: `python manage.py migrate`. There is currently
   no release-command wrapper — run it via the Railway run command or add a
   start script that migrates before launching Gunicorn. Do not skip this;
   the `employee_id` nullable migration (`0002`) must be applied.
4. `collectstatic` is handled by WhiteNoise (`CompressedManifestStaticFilesStorage`
   via `STORAGES`); `staticfiles/` is the target. Media uploads
   (`employee_profiles/`, `profiles/`) are stored on the container
   filesystem by default and **will not persist** across Railway restarts —
   acceptable for an internal pilot, not for production (see §9).
5. Frontend: deploy separately (Railway static, Vercel, or equivalent) with
   `VITE_API_BASE_URL=https://<backend>/api`. Verify `/api/health/` returns
   `{"status": "ok"}` before debugging anything else.

## 9. Known limitations and what you would build next

1. **No departments table.** Fine today; add a `departments` app with
   `Department` (name, manager FK, budget) and migrate `Employee.department`
   to FK when HR needs it. Requires a data migration mapping current choice
   values.
2. **Ephemeral media storage.** Profile pictures live on local disk. Move to
   S3/R2-backed `django-storages` before relying on uploads.
3. **No pagination/filter parity on some admin actions.** `leaves/summary/`
   returns a fixed 5; fine for a dashboard feed, but do not reuse it as a
   listing endpoint.
4. **No audit log.** Approvals stamp reviewer + timestamp, but there is no
   append-only history of who changed employee records or attendance. Add
   `django-simple-history` or an explicit audit table before compliance asks.
5. **No payroll, shifts, holidays, or notifications.** The natural next
   domains, in that order: holiday calendar (leave validation depends on
   it), email notifications on approve/reject, then attendance regularization
   (employee requests correction, admin approves) instead of direct admin
   edits.
6. **Employee creation does not create a login.** HR creates the `Employee`
   row and the `CustomUser` separately, then links them (`Employee.user`).
   A combined "onboard employee + issue credentials" flow would reduce
   unlinked-profile 404s on `/my-profile/`.
7. **Tests use `date.today()`-relative fixtures**, which is correct for
   validation tests but means time-sensitive tests assume server TZ
   (`Asia/Kolkata` in settings). Keep using relative dates; never hardcode.
8. **Frontend data fetching is `useEffect` + axios per page** with no shared
   cache. Works at this scale. If dashboards get heavier, introduce React
   Query and re-enable the disabled eslint rules.
