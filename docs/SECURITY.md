# Virelia — Security & Privacy Architecture

As a digital wellness platform handling sensitive student self-reflections and behavioral practice data, Virelia incorporates defensive engineering practices across authentication, authorization, data isolation, and network transport.

---

## 1. Authentication Security

### 1.1 Password Hashing with Argon2id
- Passwords are encrypted exclusively with **Argon2id** (`argon2-cffi`), the winner of the Password Hashing Competition (PHC).
- Protects against GPU and ASIC cracking attacks through memory-hard operations.
- Plaintext passwords are never recorded in database fields, error logs, or audit events.

### 1.2 Administrator Multi-Factor Authentication (MFA)
- Every administrator login requires a secondary step: a time-sensitive, cryptographically secure 6-digit numeric OTP.
- OTPs expire after 5 minutes and are stored in the database as salted Argon2/SHA-256 hashes.
- Verification is rate-limited (maximum 5 attempts). Once used or expired, OTPs are immediately invalidated.

### 1.3 JWT Token Lifecycle
- JWT access tokens are signed with HMAC-SHA256 (`HS256`) and expire within 60 minutes.
- Refresh tokens are stored securely and rotated upon renewal.

---

## 2. Authorization & Data Isolation

### 2.1 Backend RBAC Authority
- The frontend route guards serve purely for UI state management; the FastAPI backend serves as the authoritative arbiter of access control.
- Reusable FastAPI dependencies (`require_admin`, `require_patient`, `get_current_user`) gate all endpoints.

### 2.2 Strict Multi-Tenant Patient Isolation
- A patient can **only** query records where `patient_id == current_user.id`.
- Attempts to query another user's assessments, submissions, session logs, or reports return `HTTP 403 Forbidden` or `HTTP 404 Not Found`.

---

## 3. Media & File Upload Protection

- **No Public Filesystem Exposure**: The browser never receives absolute filesystem paths.
- **Path Traversal Sanitization**: All incoming storage keys are resolved strictly inside the sandbox directory (`MEDIA_ROOT`). Attempts with `../` or null bytes are rejected.
- **MIME & Size Enforcement**: Uploads are restricted to MP4 video binaries capped at 500 MB.

---

## 4. AI & Data Privacy Safeguards

- **Non-Diagnostic Boundaries**: AI prompt templates explicitly forbid diagnostic terminology (e.g., DSM criteria, clinical depression, panic disorder).
- **Mandatory Human Verification**: AI outputs are stored in `draft` or `awaiting_review` status. Reports are never released to patients without explicit doctor approval.
- **Data Minimization**: AI requests include only written question texts and the patient's answers. Passwords, names, emails, and database keys are never passed to external AI providers.
