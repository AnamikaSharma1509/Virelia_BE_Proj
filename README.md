# VIRELIA — Practice. Perform. Grow.

> **"Build confidence before you face the real world."**
> 
> Virelia is a guided confidence-building platform that helps students and patients practice challenging real-world situations through structured assessments, immersive scenario videos, personal reflections, and progress tracking.

---

## 1. Important Healthcare and Safety Boundary

**Virelia is a guided practice and confidence-building platform, not a diagnostic or clinical treatment system.**
- It does **not** claim to diagnose, cure, treat, or clinically measure anxiety, phobias, or psychological disorders.
- It does **not** generate medical diagnoses or clinical severity classifications.
- **AI Integration**: AI serves strictly as a drafting assistant for preliminary summarization and thematic observations. Reports require licensed human doctor / administrator review, editing, and approval before being released to patients.
- **Exposure Safety**: All scenario exposures are completely self-paced. Patients have visible controls to pause, stop, or exit anytime without penalty. Stopping is treated as a healthy boundary and never punishes the user.

---

## 2. Key Features Implemented

### 2.1 Public Experience
- **Brand System**: Calm, modern, trustworthy aesthetic with tailored midnight blue / deep indigo (`#1e1b4b`), soft lavender, and muted teal accents.
- **Landing Page**: Hero showcase, "How It Works" 4-step progression (Assess → Practice → Reflect → Grow), the 4 guided scenario cards, and safety disclaimers.
- **Information Pages**: Comprehensive `/about`, `/safety`, `/privacy`, and `/terms` pages emphasizing ethical digital wellness and transparency.

### 2.2 Role-Based Portals & Authentication
- **Unified Login**: A single login page at `/login` serving both patients and administrators, redirecting dynamically based on authoritative database roles.
- **Patient Registration**: Self-service onboarding at `/register` requiring explicit consent and disclaimer acknowledgment.
- **Admin MFA**: Enforced multi-factor authentication for administrators via secure 6-digit numeric OTPs.
- **Argon2id**: Memory-hard password hashing with cryptographically random salts.

### 2.3 Patient Portal (`/patient/*`)
- **Personalized Dashboard**: Real-time count of pending assignments, completed sessions, and next action cards.
- **Assessment Engine**: Interactive taking of single-choice MCQs and written responses with answer autosaving, timer tracking, and question review navigator.
- **Guided Practice**: Browse the 4 scenario categories (Interview Confidence, Stage & Presentation, Heights, and Congested Spaces).
- **Session Video Player**: Authenticated HTTP 206 Partial Content video streaming, pre- and post-session comfort ratings (1–10 scale), real-time event telemetry, and reflection journaling.
- **Reports & Progress**: View approved, doctor-released clinical reports with objective scores, AI summaries, and personalized practice recommendations; historical session logs with comfort progression charts.

### 2.4 Administrator Portal (`/admin/*`)
- **Clinical Dashboard**: Aggregated patient counts, pending assessment reviews, and scenario completion statistics.
- **Patient Management**: Search, filter, inspect full history, and activate/deactivate patient accounts.
- **Assessment Builder**: Create and edit assessments with MCQ points and written rubrics; publish and bulk-assign to patients.
- **Review Queue & Approval**: Review submitted answers, trigger or inspect AI draft analysis, edit clinical feedback, approve, and release reports to patients.
- **Scenario & Video Management**: Manage 4 scenario configurations and 8 video slots; upload replacement MP4 media files.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript (Strict Mode), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (async/sync ORM), Alembic migrations, Pydantic v2, Argon2id (`argon2-cffi`), PyJWT, HTTP 206 Range Streaming.
- **Database**: PostgreSQL 17 (port `5433` / `5432`), UUIDv4 primary keys.
- **Unity 3D Engine**: Universal Render Pipeline (URP), offline H.264 MP4 export pipeline, OpenXR future live headset bridge.
- **AI Engine**: Modular `AIProvider` abstraction with automatic `LocalFallbackProvider` (rule-based, non-diagnostic summarizer) and `OpenAICompatibleProvider`.

---

## 4. Quick Start (Windows 11)

### Option A: One-Click Windows Launcher
Run the root startup script:
```cmd
start-dev.bat
```
This automatically verifies dependencies and launches both the backend and frontend in dedicated console windows.

### Option B: Manual Startup

#### Step 1: Database Setup
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE virelia_db;
```

#### Step 2: Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Run database migrations:
```powershell
alembic upgrade head
```

Seed initial data (scenarios, sample assessments, administrator, and demo patient):
```powershell
python -m app.seed.seed_data
```

Generate the 8 playable H.264 scenario video assets:
```powershell
python -m app.seed.generate_sample_videos
```

Start the FastAPI backend:
```powershell
python -m uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

#### Step 3: Frontend Setup
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 5. Default Development Credentials

| Account | Email | Password | Role | MFA Details |
|---|---|---|---|---|
| **Platform Administrator** | `anamika.admin@gmail.com` | `Admin@Virelia2026!` | `admin` | Enforced (OTP printed to backend console in dev) |
| **Demo Patient** | `demo.patient@virelia.com` | `Patient@Virelia2026!` | `patient` | Direct password login |

---

## 6. Testing & Quality Assurance

### Automated Backend Tests
Run the 12 comprehensive test suites covering all 21 requirements:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```
**Test Results**: `12 passed in 17.61s` on isolated test database `virelia_test_db`.

### Frontend Build Verification
Verify strict TypeScript compilation and production assets:
```powershell
cd frontend
npm run build
```
**Build Results**: TypeScript checked with 0 errors; production bundle built cleanly in 11.9s.

---

## 7. Project Documentation

Detailed guides are available in the [`docs/`](docs/) directory:
- [System Architecture](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Database Schema & Data Dictionary](docs/DATABASE.md)
- [Security & Privacy Architecture](docs/SECURITY.md)
- [Unity XR Integration Guide](docs/UNITY_INTEGRATION.md)
- [Setup & Local Installation Guide](docs/SETUP.md)
- [Unity 3D Assets README](unity/VireliaXR/README.md)
