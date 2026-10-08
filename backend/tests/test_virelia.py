import uuid
import pytest
from datetime import datetime
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, PatientProfile
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentAssignment, AssessmentAttempt
from app.models.scenario import Scenario, ScenarioVideo, ScenarioAssignment
from app.models.session import ExposureSession
from app.models.report import Report

def test_1_patient_registration(client, db_session):
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Sarah Connor",
        "email": "sarah.connor@virelia.com",
        "password": "Password123!",
        "consent_agreed": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "patient"
    assert "access_token" in data

def test_2_duplicate_registration_rejection(client, db_session):
    user = User(
        id=uuid.uuid4(),
        email="duplicate.com@virelia.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Duplicate User",
        role="patient",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    res = client.post("/api/v1/auth/register", json={
        "full_name": "Duplicate User",
        "email": "duplicate.com@virelia.com",
        "password": "Password123!",
        "consent_agreed": True
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_3_login_success_patient(client, db_session):
    user = User(
        id=uuid.uuid4(),
        email="patient.login@virelia.com",
        password_hash=get_password_hash("Secret123!"),
        full_name="Login Patient",
        role="patient",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    res = client.post("/api/v1/auth/login", json={
        "email": "patient.login@virelia.com",
        "password": "Secret123!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["role"] == "patient"

def test_4_invalid_login_rejection(client, db_session):
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@virelia.com",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401

def test_5_admin_mfa_flow(client, db_session):
    admin = User(
        id=uuid.uuid4(),
        email="admin.mfa@virelia.com",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Admin MFA",
        role="admin",
        is_active=True,
        mfa_enabled=True
    )
    db_session.add(admin)
    db_session.commit()

    # Step 1: Login triggers MFA challenge
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin.mfa@virelia.com",
        "password": "AdminPass123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data.get("mfa_required") is True
    challenge_id = login_data["challenge_id"]

    # Step 2: Invalid OTP rejected
    verify_bad = client.post("/api/v1/auth/verify-mfa", json={
        "challenge_id": challenge_id,
        "otp": "000000"
    })
    assert verify_bad.status_code == 400

def test_6_7_rbac_patient_cannot_access_admin_routes(client, db_session):
    patient = User(
        id=uuid.uuid4(),
        email="regular.patient@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Regular Patient",
        role="patient",
        is_active=True
    )
    db_session.add(patient)
    db_session.commit()

    token = create_access_token(patient.id, role="patient")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 403

def test_8_patient_data_isolation(client, db_session):
    patient_a = User(
        id=uuid.uuid4(),
        email="patient.a@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Patient A",
        role="patient",
        is_active=True
    )
    patient_b = User(
        id=uuid.uuid4(),
        email="patient.b@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Patient B",
        role="patient",
        is_active=True
    )
    db_session.add_all([patient_a, patient_b])
    db_session.commit()

    token_b = create_access_token(patient_b.id, role="patient")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # B cannot view A's admin/patient profile directly
    res = client.get(f"/api/v1/admin/patients/{patient_a.id}", headers=headers_b)
    assert res.status_code == 403

def test_9_10_assessment_creation_and_assignment(client, db_session):
    admin = User(
        id=uuid.uuid4(),
        email="admin.creator@virelia.com",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Dr. Creator",
        role="admin",
        is_active=True
    )
    patient = User(
        id=uuid.uuid4(),
        email="patient.assigned@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Assigned Student",
        role="patient",
        is_active=True
    )
    db_session.add_all([admin, patient])
    db_session.commit()

    admin_token = create_access_token(admin.id, role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create Assessment
    create_res = client.post("/api/v1/admin/assessments", headers=headers, json={
        "title": "Public Speaking Test",
        "description": "Test assessment description",
        "category": "Stage Practice",
        "estimated_duration": 10,
        "is_published": True,
        "questions": [
            {
                "question_text": "What is key to opening a speech?",
                "question_type": "mcq",
                "options": ["Pause and breathe", "Rush immediately"],
                "correct_option": "Pause and breathe",
                "points": 5.0,
                "is_required": True,
                "order_index": 0
            },
            {
                "question_text": "Describe your pre-speech thoughts.",
                "question_type": "written",
                "options": None,
                "correct_option": None,
                "points": 5.0,
                "is_required": True,
                "order_index": 1
            }
        ]
    })
    assert create_res.status_code == 200
    assessment_id = create_res.json()["id"]

    # Assign Assessment
    assign_res = client.post("/api/v1/admin/assignments", headers=headers, json={
        "assessment_id": assessment_id,
        "patient_ids": [str(patient.id)],
        "instructions": "Complete before Friday"
    })
    assert assign_res.status_code == 200
    assert len(assign_res.json()) == 1

def test_11_12_13_submission_deterministic_scoring_ai_fallback(client, db_session):
    patient = User(
        id=uuid.uuid4(),
        email="student.taker@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Student Taker",
        role="patient",
        is_active=True
    )
    db_session.add(patient)
    db_session.flush()

    assessment = Assessment(
        id=uuid.uuid4(),
        title="Scoring Test Assessment",
        description="Testing scoring",
        category="General",
        is_published=True
    )
    db_session.add(assessment)
    db_session.flush()

    q1 = AssessmentQuestion(
        id=uuid.uuid4(),
        assessment_id=assessment.id,
        question_text="2 + 2?",
        question_type="mcq",
        options=["3", "4"],
        correct_option="4",
        points=10.0,
        order_index=0
    )
    q2 = AssessmentQuestion(
        id=uuid.uuid4(),
        assessment_id=assessment.id,
        question_text="Reflect on your preparation habits.",
        question_type="written",
        points=10.0,
        order_index=1
    )
    db_session.add_all([q1, q2])

    assignment = AssessmentAssignment(
        id=uuid.uuid4(),
        assessment_id=assessment.id,
        patient_id=patient.id,
        status="assigned"
    )
    db_session.add(assignment)
    db_session.commit()

    patient_token = create_access_token(patient.id, role="patient")
    headers = {"Authorization": f"Bearer {patient_token}"}

    # Start attempt
    start_res = client.post(f"/api/v1/assignments/{assignment.id}/start", headers=headers)
    assert start_res.status_code == 200
    attempt_id = start_res.json()["id"]

    # Submit answers (Correct MCQ + thoughtful written answer)
    submit_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=headers, json={
        "answers": [
            {"question_id": str(q1.id), "selected_option": "4"},
            {"question_id": str(q2.id), "written_answer": "I felt nervous initially, but structured notes and deep breathing helped me stay calm."}
        ]
    })
    assert submit_res.status_code == 200
    data = submit_res.json()
    assert data["awarded_points"] == 10.0  # MCQ points calculated deterministically
    assert data["total_points"] == 20.0
    assert data["percentage"] == 50.0
    assert data["status"] == "under_review"

def test_14_15_16_report_approval_and_release_isolation(client, db_session):
    admin = User(
        id=uuid.uuid4(),
        email="admin.reviewer@virelia.com",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Dr. Reviewer",
        role="admin",
        is_active=True
    )
    patient = User(
        id=uuid.uuid4(),
        email="patient.report@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Report Patient",
        role="patient",
        is_active=True
    )
    db_session.add_all([admin, patient])
    db_session.flush()

    report = Report(
        id=uuid.uuid4(),
        patient_id=patient.id,
        title="Confidence Growth Report",
        ai_summary="Participant expressed solid preparation habits.",
        status="awaiting_review"
    )
    db_session.add(report)
    db_session.commit()

    admin_token = create_access_token(admin.id, role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    patient_token = create_access_token(patient.id, role="patient")
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # 16: Patient cannot access unreleased report
    unreleased_res = client.get(f"/api/v1/reports/{report.id}", headers=patient_headers)
    assert unreleased_res.status_code == 403

    # 14: Admin reviews and approves report
    approve_res = client.post(f"/api/v1/admin/reports/{report.id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200

    # 15: Admin releases report
    release_res = client.post(f"/api/v1/admin/reports/{report.id}/release", headers=admin_headers)
    assert release_res.status_code == 200

    # Patient can now access released report
    released_res = client.get(f"/api/v1/reports/{report.id}", headers=patient_headers)
    assert released_res.status_code == 200
    assert released_res.json()["status"] == "released"

def test_17_18_19_session_lifecycle_and_telemetry(client, db_session):
    patient = User(
        id=uuid.uuid4(),
        email="session.user@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Session Patient",
        role="patient",
        is_active=True
    )
    db_session.add(patient)
    db_session.flush()

    scenario = Scenario(
        id=uuid.uuid4(),
        title="Heights Exposure Test",
        slug="heights-test",
        description="Testing heights",
        category="Heights",
        is_active=True
    )
    db_session.add(scenario)
    db_session.flush()

    video = ScenarioVideo(
        id=uuid.uuid4(),
        scenario_id=scenario.id,
        title="Balcony View Level 1",
        level=1,
        is_active=True
    )
    db_session.add(video)
    db_session.flush()

    sa = ScenarioAssignment(
        id=uuid.uuid4(),
        scenario_id=scenario.id,
        patient_id=patient.id,
        status="assigned"
    )
    db_session.add(sa)
    db_session.commit()

    patient_token = create_access_token(patient.id, role="patient")
    headers = {"Authorization": f"Bearer {patient_token}"}

    # 17: Start Session with pre-comfort rating
    start_res = client.post("/api/v1/sessions/start", headers=headers, json={
        "scenario_id": str(scenario.id),
        "video_id": str(video.id),
        "pre_comfort_rating": 4
    })
    assert start_res.status_code == 200
    session_id = start_res.json()["id"]

    # 18: Record Event
    ev_res = client.post(f"/api/v1/sessions/{session_id}/events", headers=headers, json={
        "event_type": "video_paused",
        "event_data": {"playback_time": 45}
    })
    assert ev_res.status_code == 200

    # 19: Complete Session with post-comfort rating
    comp_res = client.post(f"/api/v1/sessions/{session_id}/complete", headers=headers, json={
        "post_comfort_rating": 7,
        "reflection": "Felt more comfortable after looking at the stable railing.",
        "duration_seconds": 180
    })
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"
    assert comp_res.json()["post_comfort_rating"] == 7

def test_20_session_isolation(client, db_session):
    patient_x = User(
        id=uuid.uuid4(),
        email="patient.x@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Patient X",
        role="patient",
        is_active=True
    )
    patient_y = User(
        id=uuid.uuid4(),
        email="patient.y@virelia.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Patient Y",
        role="patient",
        is_active=True
    )
    db_session.add_all([patient_x, patient_y])
    db_session.flush()

    scenario = Scenario(
        id=uuid.uuid4(),
        title="Auditorium Test",
        slug="auditorium-test",
        description="Testing",
        category="Stage",
        is_active=True
    )
    db_session.add(scenario)
    db_session.flush()

    session_x = ExposureSession(
        id=uuid.uuid4(),
        patient_id=patient_x.id,
        scenario_id=scenario.id,
        started_at=datetime.utcnow(),
        status="in_progress"
    )
    db_session.add(session_x)
    db_session.commit()

    token_y = create_access_token(patient_y.id, role="patient")
    headers_y = {"Authorization": f"Bearer {token_y}"}

    # Patient Y tries to access Patient X's session
    res = client.get(f"/api/v1/sessions/{session_x.id}", headers=headers_y)
    assert res.status_code == 403
