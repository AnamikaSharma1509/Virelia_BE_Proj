# Virelia — REST API Reference

The Virelia backend exposes an interactive OpenAPI specification accessible at:
`http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`.

Base URL: `http://localhost:8000/api/v1`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new patient account | No |
| `POST` | `/auth/login` | Authenticate user; returns tokens or MFA challenge | No |
| `POST` | `/auth/verify-mfa` | Submit 6-digit OTP for admin MFA challenge | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Bearer |
| `POST` | `/auth/refresh` | Rotate and issue new access token | Refresh Bearer |
| `POST` | `/auth/change-password` | Update account password | Bearer |
| `POST` | `/auth/logout` | Revoke session and log out | Bearer |

---

## 2. Patient Portal Endpoints (`/api/v1/patient`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/patient/dashboard` | Aggregated patient metrics and next steps | `patient` |
| `GET` | `/patient/profile` | Current patient preferences & doctor info | `patient` |
| `PATCH` | `/patient/profile` | Update permitted profile fields | `patient` |
| `GET` | `/patient/assignments` | Assigned assessments list | `patient` |
| `GET` | `/patient/scenarios` | Assigned and available scenarios | `patient` |
| `GET` | `/patient/sessions` | Patient's historical exposure sessions | `patient` |
| `GET` | `/patient/reports` | Approved and released clinical reports | `patient` |
| `GET` | `/patient/notifications` | In-app alerts and notifications | `patient` |
| `POST` | `/patient/notifications/{id}/read` | Mark alert as read | `patient` |

---

## 3. Assessment & Submission Endpoints

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/assessments/{id}` | Get assessment questions (without answers) | `patient` / `admin` |
| `POST` | `/assignments/{id}/start` | Start or resume an assessment attempt | `patient` |
| `GET` | `/assignments/{id}/attempt` | Fetch in-progress draft attempt | `patient` |
| `PUT` | `/attempts/{id}/answers` | Autosave question answers | `patient` |
| `POST` | `/attempts/{id}/submit` | Submit completed attempt & calculate score | `patient` |
| `GET` | `/attempts/{id}/status` | Check submission and review state | `patient` |

---

## 4. Exposure Sessions & Video Streaming

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/sessions/start` | Initialize session with pre-comfort rating | `patient` |
| `GET` | `/sessions/{id}` | Fetch session details | `patient` / `admin` |
| `POST` | `/sessions/{id}/events` | Log player events (pause, resume, etc.) | `patient` |
| `POST` | `/sessions/{id}/complete` | Mark video complete & post-comfort rating | `patient` |
| `POST` | `/sessions/{id}/stop` | Non-punitive emergency stop / interruption | `patient` |
| `POST` | `/sessions/{id}/reflection` | Submit patient reflection text | `patient` |
| `GET` | `/videos/{id}/stream` | Stream protected MP4 with HTTP 206 range | Authenticated |

---

## 5. Administrator Management (`/api/v1/admin`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Live platform metrics and pending queues | `admin` |
| `GET` | `/admin/patients` | Paginated and filtered patient list | `admin` |
| `POST` | `/admin/patients` | Provision new patient account | `admin` |
| `GET` | `/admin/patients/{id}` | Patient deep-dive overview and history | `admin` |
| `POST` | `/admin/patients/{id}/activate` | Activate patient account | `admin` |
| `POST` | `/admin/patients/{id}/deactivate` | Deactivate patient account | `admin` |
| `GET` | `/admin/assessments` | List assessment templates | `admin` |
| `POST` | `/admin/assessments` | Create assessment with MCQ and written items | `admin` |
| `POST` | `/admin/assessments/{id}/publish` | Publish assessment for assignment | `admin` |
| `POST` | `/admin/assignments` | Assign assessment to patient(s) | `admin` |
| `GET` | `/admin/submissions` | Assessment review queue | `admin` |
| `GET` | `/admin/submissions/{id}` | Submission answers and AI draft | `admin` |
| `POST` | `/admin/submissions/{id}/review` | Edit feedback and practice suggestions | `admin` |
| `POST` | `/admin/submissions/{id}/approve` | Formally approve report | `admin` |
| `POST` | `/admin/submissions/{id}/release` | Release report to patient view | `admin` |
| `GET` | `/admin/scenarios` | Manage 4 scenario configurations | `admin` |
| `POST` | `/admin/scenarios/{id}/assign` | Assign scenario to patients | `admin` |
| `POST` | `/admin/videos/upload` | Upload replacement MP4 video | `admin` |
