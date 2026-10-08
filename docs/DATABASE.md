# Virelia — Database Schema & Data Dictionary

Virelia uses **PostgreSQL 17** as its authoritative transactional data store. All major entities utilize **UUIDv4** primary keys, foreign key constraints with indexed lookup columns, and strict enum checks. Database migrations are managed via **Alembic**.

---

## 1. Entity-Relationship Overview

```
users (1) ───┬─── (1) patient_profiles
             ├─── (1) doctor_profiles
             ├─── (N) consent_records
             ├─── (N) notifications
             ├─── (N) audit_logs
             └─── (N) otp_codes

users (patient) ───┬─── (N) assessment_assignments ─── (N) assessment_attempts ─── (N) assessment_answers
                   ├─── (N) scenario_assignments
                   ├─── (N) exposure_sessions ────── (N) session_events
                   └─── (N) reports ──────────────── (1) ai_analyses

assessments (1) ─────── (N) assessment_questions
scenarios (1)   ─────── (N) scenario_videos
```

---

## 2. Table Specifications

### `users`
- `id` (UUID, PK)
- `full_name` (VARCHAR(150), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL, INDEXED)
- `password_hash` (VARCHAR(255), NOT NULL)
- `role` (VARCHAR(20), NOT NULL: `'patient'` | `'admin'`)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `is_verified` (BOOLEAN, DEFAULT FALSE)
- `must_change_password` (BOOLEAN, DEFAULT FALSE)
- `mfa_enabled` (BOOLEAN, DEFAULT FALSE)
- `last_login_at` (TIMESTAMP, NULLABLE)
- `created_at`, `updated_at` (TIMESTAMP)

### `patient_profiles`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, ON DELETE CASCADE, UNIQUE)
- `date_of_birth` (VARCHAR(20), NULLABLE)
- `profile_preferences` (JSONB / JSON)
- `created_at`, `updated_at` (TIMESTAMP)

### `assessments` & `assessment_questions`
- `assessments.id` (UUID, PK)
- `assessments.title` (VARCHAR(200), NOT NULL)
- `assessments.category` (VARCHAR(100), NOT NULL)
- `assessments.is_published` (BOOLEAN, DEFAULT FALSE)
- `assessment_questions.id` (UUID, PK)
- `assessment_questions.assessment_id` (UUID, FK -> `assessments.id`)
- `assessment_questions.question_type` (VARCHAR(20): `'mcq'` | `'written'`)
- `assessment_questions.options` (JSON: array of options for MCQ)
- `assessment_questions.correct_option` (VARCHAR(255): withheld from patient APIs)
- `assessment_questions.points` (FLOAT, DEFAULT 1.0)
- `assessment_questions.order_index` (INT)

### `assessment_attempts` & `assessment_answers`
- `assessment_attempts.id` (UUID, PK)
- `assessment_attempts.assignment_id` (UUID, FK)
- `assessment_attempts.patient_id` (UUID, FK)
- `assessment_attempts.status` (VARCHAR(30): `'not_started'`, `'in_progress'`, `'submitted'`, `'under_review'`, `'approved'`, `'released'`)
- `assessment_attempts.awarded_points`, `total_points`, `percentage` (FLOAT)
- `assessment_answers.attempt_id` (UUID, FK)
- `assessment_answers.question_id` (UUID, FK)
- `assessment_answers.selected_option` (VARCHAR)
- `assessment_answers.written_answer` (TEXT)
- `assessment_answers.is_correct` (BOOLEAN)

### `scenarios` & `scenario_videos`
- `scenarios.id` (UUID, PK)
- `scenarios.slug` (VARCHAR(100), UNIQUE)
- `scenarios.category` (VARCHAR(100))
- `scenarios.is_active` (BOOLEAN)
- `scenario_videos.scenario_id` (UUID, FK)
- `scenario_videos.level` (INT: 1 or 2)
- `scenario_videos.file_path` (VARCHAR(500): relative storage key)

### `exposure_sessions` & `session_events`
- `exposure_sessions.id` (UUID, PK)
- `exposure_sessions.patient_id` (UUID, FK)
- `exposure_sessions.scenario_id` (UUID, FK)
- `exposure_sessions.video_id` (UUID, FK)
- `exposure_sessions.pre_comfort_rating` (INT: 1–10)
- `exposure_sessions.post_comfort_rating` (INT: 1–10)
- `exposure_sessions.reflection` (TEXT)
- `exposure_sessions.status` (VARCHAR(20): `'in_progress'`, `'completed'`, `'interrupted'`)
- `session_events.session_id` (UUID, FK)
- `session_events.event_type` (VARCHAR(50))
- `session_events.event_timestamp` (TIMESTAMP)

### `reports` & `ai_analyses`
- `reports.id` (UUID, PK)
- `reports.patient_id` (UUID, FK)
- `reports.assessment_attempt_id` (UUID, FK, NULLABLE)
- `reports.session_id` (UUID, FK, NULLABLE)
- `reports.ai_summary` (TEXT)
- `reports.reviewer_feedback` (TEXT)
- `reports.practice_recommendations` (TEXT)
- `reports.status` (VARCHAR(30): `'draft'`, `'awaiting_review'`, `'approved'`, `'released'`)
- `reports.approved_at`, `released_at` (TIMESTAMP)

---

## 3. Database Maintenance Commands

- **Run Alembic Migrations**:
  ```powershell
  cd backend
  .\venv\Scripts\alembic upgrade head
  ```
- **Seed Initial Data**:
  ```powershell
  cd backend
  .\venv\Scripts\python -m app.seed.seed_data
  ```
