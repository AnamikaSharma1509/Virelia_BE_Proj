# Virelia — System Architecture

Virelia is an end-to-end guided confidence-building platform engineered with a strict **modular monolithic architecture**, separating clear domain boundaries across presentation, business services, persistent storage, and secure media delivery.

---

## 1. High-Level Architectural Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons │
│                                                             │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │     Patient Portal      │   │   Administrator Portal   │ │
│  │ (Assessments, Scenarios,│   │ (Review, Approval, MFA,  │ │
│  │   Sessions, Reports)    │   │  Analytics, Assignments) │ │
│  └─────────────────────────┘   └──────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / HTTPS (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway & Middleware                 │
│  FastAPI Application • CORS • Audit Logging • JWT / MFA     │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
│ Auth & Users │       │ Assessments  │       │ Exposure Engine │
│ • Argon2id   │       │ • Determin-  │       │ • Video Player  │
│ • JWT Tokens │       │   istic MCQ  │       │ • HTTP Range    │
│ • MFA OTP    │       │ • Rubrics    │       │   Streaming 206 │
└──────┬───────┘       └───────┬──────┘       └────────┬────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI & Analysis Services                    │
│  • AIProvider Abstract Base Class                           │
│  • LocalFallbackProvider (Deterministic & Non-diagnostic)   │
│  • OpenAICompatibleProvider (Configurable Remote API)       │
│  • Human-in-the-Loop Clinical Review & Release Guard        │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐       ┌────────────────────────┐
│      PostgreSQL 17 DB        │       │  Secure Media Storage  │
│  • SQLAlchemy 2.0 ORM        │       │  • Private MP4 Storage │
│  • Alembic Migrations        │       │  • Path Sanitization   │
│  • UUID Primary Keys         │       │  • Range Chunk Stream  │
└──────────────────────────────┘       └────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Authentication & Multi-Factor Access Control
- **Unified Login**: A single endpoint (`/api/v1/auth/login`) handles all user credentials.
- **Role Isolation**: Strictly partitioned into `patient` and `admin`. Patient registration never permits role escalation.
- **Argon2id Hashing**: Password hashing uses Argon2id with random 16-byte salts and memory-hard configuration.
- **MFA Challenge**: Administrator accounts trigger a mandatory 6-digit numeric OTP challenge valid for 5 minutes with attempt throttling.

### 2.2 Assessment Engine & Scoring
- **Authoritative Backend Scoring**: Correct answers (`correct_option`) are excluded from all patient-facing serializers.
- **Deterministic MCQ Evaluation**: Backend compares submitted answers directly to database records and calculates percentage and awarded points within a database transaction.
- **Written Answer Processing**: Qualitative questions are stored and forwarded to the AI analysis subsystem for structured theme extraction.

### 2.3 AI-Assisted Non-Diagnostic Reporting
- **Ethical Boundary**: The AI prompt explicitly prohibits making medical diagnoses or clinical severity claims.
- **Human Review Enforced**: AI-generated output is stored as a draft. Reports remain confidential until an administrator explicitly conducts a review, edits feedback, approves, and releases the report.

### 2.4 Media Delivery & Unity XR Bridge
- **Offline Render Workflow**: High-fidelity 3D scenarios are authored in Unity, rendered to H.264 MP4 assets, and stored in a private directory.
- **Protected Streaming**: Direct filesystem access is prevented. Media files are served via `/api/v1/videos/{video_id}/stream` with HTTP 206 Partial Content byte-range support for smooth browser playback.
- **Event Tracking**: Client records pre/post comfort ratings (1–10 scale) and lifecycle events (pause, resume, emergency stop, completion). Non-punitive stop ensures patients can exit anytime.
