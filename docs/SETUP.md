# Virelia — Setup & Local Installation Guide

This guide details instructions to run Virelia locally on **Windows 11** using PowerShell or VS Code terminal.

---

## 1. Prerequisites

1. **Python 3.11+**:
   Verify installation:
   ```powershell
   python --version
   ```
2. **Node.js LTS (v20+) & npm**:
   Verify installation:
   ```powershell
   node -v
   npm -v
   ```
3. **PostgreSQL 17**:
   PostgreSQL running locally on port `5433` (or default `5432`). Ensure database `virelia_db` exists:
   ```sql
   CREATE DATABASE virelia_db;
   ```
4. **Git**:
   Verify installation:
   ```powershell
   git --version
   ```

---

## 2. Quick Start (Windows Launcher)

Double-click `start-dev.bat` in the project root, or execute:
```powershell
.\start-dev.bat
```
This script automatically checks virtual environments, installs missing packages, and launches both the backend and frontend in separate consoles.

---

## 3. Manual Step-by-Step Installation

### 3.1 Backend Setup

1. Open PowerShell and navigate to `backend`:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *Note: If PowerShell execution policy restricts scripts, run:*
   `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
3. Upgrade pip and install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Configure environment:
   Copy `.env.example` to `.env` and verify database credentials:
   ```ini
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5433/virelia_db
   ADMIN_EMAIL=anamika.admin@gmail.com
   ADMIN_INITIAL_PASSWORD=Admin@Virelia2026!
   ```
5. Run Alembic migrations:
   ```powershell
   alembic upgrade head
   ```
6. Seed scenarios, sample assessments, administrator, and demo patient:
   ```powershell
   python -m app.seed.seed_data
   ```
7. Start the FastAPI development server:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API is accessible at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 3.2 Frontend Setup

1. Open a new PowerShell terminal and navigate to `frontend`:
   ```powershell
   cd frontend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Verify or create `.env`:
   ```ini
   VITE_API_URL=http://localhost:8000/api/v1
   ```
4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   The web application is accessible at `http://localhost:5173`.

---

## 4. Default Seed Accounts

| Role | Email | Password | Multi-Factor Authentication |
|---|---|---|---|
| **Administrator** | `anamika.admin@gmail.com` | `Admin@Virelia2026!` | Enforced (Console OTP sink in dev: inspect terminal) |
| **Demo Patient** | `demo.patient@virelia.com` | `Patient@Virelia2026!` | Not required |
| **New Patient** | Self-register at `/register` | User chosen | Optional |

---

## 5. Running Automated Backend Tests

To run the complete automated test suite on an isolated test database:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```
All 12 test suites covering 21 core requirements will run and report execution status.
