import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.db.session import get_db
from app.core.permissions import require_admin
from app.core.security import get_password_hash
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User, PatientProfile, DoctorProfile
from app.models.assessment import Assessment, AssessmentAssignment, AssessmentAttempt
from app.models.scenario import Scenario, ScenarioAssignment
from app.models.session import ExposureSession
from app.models.report import Report
from app.models.audit import AuditLog
from app.schemas.auth import AdminCreatePatientRequest, UserResponse
from app.schemas.dashboard import AdminDashboardResponse

router = APIRouter(prefix="/admin", tags=["Administrator Management"])

@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_patients = db.query(User).filter(User.role == "patient").count()
    active_patients = db.query(User).filter(User.role == "patient", User.is_active == True).count()

    pending_assessments = db.query(AssessmentAssignment).filter(
        AssessmentAssignment.status.in_(["assigned", "in_progress"])
    ).count()

    submitted_awaiting_review = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.status == "under_review"
    ).count()

    reports_awaiting_approval = db.query(Report).filter(
        Report.status.in_(["awaiting_review", "ai_completed"])
    ).count()

    completed_sessions = db.query(ExposureSession).filter(
        ExposureSession.status == "completed"
    ).count()

    # Scenario overview breakdown
    scenarios = db.query(Scenario).all()
    scenario_overview = []
    for sc in scenarios:
        assigned_cnt = db.query(ScenarioAssignment).filter(ScenarioAssignment.scenario_id == sc.id).count()
        completed_cnt = db.query(ExposureSession).filter(
            ExposureSession.scenario_id == sc.id,
            ExposureSession.status == "completed"
        ).count()
        scenario_overview.append({
            "scenario_id": str(sc.id),
            "title": sc.title,
            "category": sc.category,
            "assigned_count": assigned_cnt,
            "completed_count": completed_cnt
        })

    # Report status counts
    reports_overview = {
        "draft": db.query(Report).filter(Report.status == "draft").count(),
        "awaiting_review": db.query(Report).filter(Report.status == "awaiting_review").count(),
        "approved": db.query(Report).filter(Report.status == "approved").count(),
        "released": db.query(Report).filter(Report.status == "released").count(),
    }

    # Pending queue: assessments submitted needing review
    pending_queue = []
    attempts_needing_review = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.status == "under_review"
    ).order_by(desc(AssessmentAttempt.submitted_at)).limit(5).all()

    for att in attempts_needing_review:
        patient = db.query(User).filter(User.id == att.patient_id).first()
        assessment = att.assignment.assessment if att.assignment else None
        pending_queue.append({
            "attempt_id": str(att.id),
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "",
            "assessment_title": assessment.title if assessment else "Assessment",
            "submitted_at": att.submitted_at.isoformat() if att.submitted_at else att.created_at.isoformat(),
            "score_percentage": att.percentage
        })

    # Recent activity
    recent_activity = []
    for audit in db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(6).all():
        actor = db.query(User).filter(User.id == audit.actor_user_id).first() if audit.actor_user_id else None
        recent_activity.append({
            "action": audit.action,
            "actor_name": actor.full_name if actor else "System",
            "entity_type": audit.entity_type,
            "timestamp": audit.timestamp.isoformat(),
            "metadata": audit.metadata_json or {}
        })

    return AdminDashboardResponse(
        total_patients=total_patients,
        active_patients=active_patients,
        pending_assessments=pending_assessments,
        submitted_awaiting_review=submitted_awaiting_review,
        reports_awaiting_approval=reports_awaiting_approval,
        completed_sessions=completed_sessions,
        scenario_overview=scenario_overview,
        reports_overview=reports_overview,
        pending_queue=pending_queue,
        recent_activity=recent_activity
    )

@router.get("/patients")
def list_patients(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "patient")

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((func.lower(User.full_name).like(s)) | (func.lower(User.email).like(s)))

    if status_filter == "active":
        query = query.filter(User.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(User.is_active == False)

    patients = query.order_by(desc(User.created_at)).all()

    result = []
    for p in patients:
        assigned_assessments = db.query(AssessmentAssignment).filter(AssessmentAssignment.patient_id == p.id).count()
        completed_assessments = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.patient_id == p.id,
            AssessmentAttempt.status.in_(["submitted", "under_review", "approved", "released"])
        ).count()
        completed_sessions = db.query(ExposureSession).filter(
            ExposureSession.patient_id == p.id,
            ExposureSession.status == "completed"
        ).count()

        result.append({
            "id": p.id,
            "full_name": p.full_name,
            "email": p.email,
            "is_active": p.is_active,
            "created_at": p.created_at,
            "last_login_at": p.last_login_at,
            "assigned_assessments_count": assigned_assessments,
            "completed_assessments_count": completed_assessments,
            "completed_sessions_count": completed_sessions
        })
    return result

@router.post("/patients", response_model=UserResponse)
def create_patient(
    req: AdminCreatePatientRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    normalized_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise BadRequestException("A user with this email address already exists.")

    password = req.initial_password or "Patient@Virelia2026!"
    new_user = User(
        id=uuid.uuid4(),
        email=normalized_email,
        password_hash=get_password_hash(password),
        full_name=req.full_name.strip(),
        role="patient",
        is_active=req.is_active,
        is_verified=True,
        must_change_password=True,
        mfa_enabled=False
    )
    db.add(new_user)
    db.flush()

    prof = PatientProfile(
        id=uuid.uuid4(),
        user_id=new_user.id,
        date_of_birth=req.date_of_birth,
        profile_preferences={}
    )
    db.add(prof)

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="patient_created_by_admin",
        entity_type="users",
        entity_id=str(new_user.id),
        metadata_json={"email": normalized_email, "created_by": str(current_admin.id)}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/patients/{patient_id}")
def get_patient_detail(
    patient_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise NotFoundException("Patient not found")

    profile = patient.patient_profile

    # Assignments
    assignments = db.query(AssessmentAssignment).filter(AssessmentAssignment.patient_id == patient.id).all()
    assignments_data = [{
        "id": a.id,
        "assessment_id": a.assessment_id,
        "assessment_title": a.assessment.title if a.assessment else "",
        "assigned_at": a.assigned_at,
        "due_date": a.due_date,
        "status": a.status
    } for a in assignments]

    # Attempts
    attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.patient_id == patient.id).order_by(desc(AssessmentAttempt.created_at)).all()
    attempts_data = [{
        "id": att.id,
        "assessment_title": att.assignment.assessment.title if att.assignment and att.assignment.assessment else "",
        "started_at": att.started_at,
        "submitted_at": att.submitted_at,
        "status": att.status,
        "awarded_points": att.awarded_points,
        "total_points": att.total_points,
        "percentage": att.percentage
    } for att in attempts]

    # Sessions
    sessions = db.query(ExposureSession).filter(ExposureSession.patient_id == patient.id).order_by(desc(ExposureSession.started_at)).all()
    sessions_data = [{
        "id": s.id,
        "scenario_title": s.scenario.title if s.scenario else "",
        "video_title": s.video.title if s.video else "",
        "started_at": s.started_at,
        "duration_seconds": s.duration_seconds,
        "pre_comfort": s.pre_comfort_rating,
        "post_comfort": s.post_comfort_rating,
        "reflection": s.reflection,
        "status": s.status
    } for s in sessions]

    # Reports
    reports = db.query(Report).filter(Report.patient_id == patient.id).order_by(desc(Report.created_at)).all()
    reports_data = [{
        "id": r.id,
        "title": r.title,
        "status": r.status,
        "created_at": r.created_at,
        "approved_at": r.approved_at,
        "released_at": r.released_at
    } for r in reports]

    # Assigned Scenarios
    sc_assignments = db.query(ScenarioAssignment).filter(ScenarioAssignment.patient_id == patient.id).all()
    scenario_assignments_data = [{
        "id": sa.id,
        "scenario_id": sa.scenario_id,
        "scenario_title": sa.scenario.title if sa.scenario else "",
        "assigned_at": sa.assigned_at,
        "status": sa.status
    } for sa in sc_assignments]

    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "email": patient.email,
        "is_active": patient.is_active,
        "created_at": patient.created_at,
        "last_login_at": patient.last_login_at,
        "date_of_birth": profile.date_of_birth if profile else None,
        "preferences": profile.profile_preferences if profile else {},
        "assignments": assignments_data,
        "attempts": attempts_data,
        "sessions": sessions_data,
        "reports": reports_data,
        "scenario_assignments": scenario_assignments_data
    }

@router.patch("/patients/{patient_id}")
def update_patient_info(
    patient_id: uuid.UUID,
    payload: Dict[str, Any],
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise NotFoundException("Patient not found")

    if "full_name" in payload and payload["full_name"]:
        patient.full_name = payload["full_name"].strip()
    if "is_active" in payload:
        patient.is_active = bool(payload["is_active"])

    db.commit()
    return {"message": "Patient updated successfully"}

@router.post("/patients/{patient_id}/activate")
def activate_patient(
    patient_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise NotFoundException("Patient not found")
    patient.is_active = True
    db.commit()
    return {"message": "Patient account activated"}

@router.post("/patients/{patient_id}/deactivate")
def deactivate_patient(
    patient_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise NotFoundException("Patient not found")
    patient.is_active = False
    db.commit()
    return {"message": "Patient account deactivated"}
