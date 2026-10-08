import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.permissions import require_patient
from app.models.user import User, PatientProfile
from app.models.assessment import AssessmentAssignment, Assessment, AssessmentAttempt
from app.models.scenario import Scenario, ScenarioAssignment
from app.models.session import ExposureSession
from app.models.report import Report
from app.models.notification import Notification
from app.schemas.dashboard import PatientDashboardResponse, NotificationResponse
from app.schemas.assessment import AssessmentAssignmentResponse
from app.schemas.scenario import ScenarioResponse
from app.schemas.session import SessionResponse
from app.schemas.report import ReportResponse

router = APIRouter(prefix="/patient", tags=["Patient Portal"])

@router.get("/dashboard", response_model=PatientDashboardResponse)
def get_patient_dashboard(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    first_name = current_user.full_name.split()[0] if current_user.full_name else "Student"

    # Pending and completed assessments
    all_assignments = db.query(AssessmentAssignment).filter(AssessmentAssignment.patient_id == current_user.id).all()
    pending_count = sum(1 for a in all_assignments if a.status in ["assigned", "in_progress"])
    completed_count = sum(1 for a in all_assignments if a.status in ["submitted", "under_review", "approved", "released"])

    # Assigned scenarios count
    assigned_scenarios_count = db.query(ScenarioAssignment).filter(
        ScenarioAssignment.patient_id == current_user.id
    ).count()

    # Completed exposure sessions
    completed_sessions = db.query(ExposureSession).filter(
        ExposureSession.patient_id == current_user.id,
        ExposureSession.status == "completed"
    ).all()
    completed_sessions_count = len(completed_sessions)

    # Released reports count (Patient only sees RELEASED reports)
    released_reports_count = db.query(Report).filter(
        Report.patient_id == current_user.id,
        Report.status == "released"
    ).count()

    # Recent activities
    recent_activities = []
    # Recent assessments
    for ass in db.query(AssessmentAttempt).filter(AssessmentAttempt.patient_id == current_user.id).order_by(desc(AssessmentAttempt.created_at)).limit(3).all():
        assessment_title = ass.assignment.assessment.title if ass.assignment and ass.assignment.assessment else "Assessment"
        recent_activities.append({
            "type": "assessment",
            "title": f"Submitted {assessment_title}",
            "date": ass.submitted_at.isoformat() if ass.submitted_at else ass.created_at.isoformat(),
            "status": ass.status
        })

    # Recent sessions
    for sess in db.query(ExposureSession).filter(ExposureSession.patient_id == current_user.id).order_by(desc(ExposureSession.created_at)).limit(3).all():
        scenario_title = sess.scenario.title if sess.scenario else "Practice Session"
        recent_activities.append({
            "type": "session",
            "title": f"{scenario_title} practice session",
            "date": sess.started_at.isoformat(),
            "status": sess.status
        })

    # Comfort trends chart data (Pre vs Post comfort ratings across completed sessions)
    comfort_trends = []
    sessions_for_chart = db.query(ExposureSession).filter(
        ExposureSession.patient_id == current_user.id,
        ExposureSession.status == "completed",
        ExposureSession.pre_comfort_rating != None,
        ExposureSession.post_comfort_rating != None
    ).order_by(ExposureSession.started_at).limit(10).all()

    for idx, s in enumerate(sessions_for_chart):
        comfort_trends.append({
            "session_num": f"Session {idx + 1}",
            "scenario": s.scenario.title if s.scenario else f"S{idx+1}",
            "pre_comfort": s.pre_comfort_rating,
            "post_comfort": s.post_comfort_rating,
            "duration": round(s.duration_seconds / 60, 1)
        })

    return PatientDashboardResponse(
        first_name=first_name,
        pending_assessments_count=pending_count,
        completed_assessments_count=completed_count,
        assigned_scenarios_count=assigned_scenarios_count,
        completed_sessions_count=completed_sessions_count,
        released_reports_count=released_reports_count,
        recent_activities=recent_activities,
        comfort_trends=comfort_trends
    )

@router.get("/profile")
def get_patient_profile(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "date_of_birth": profile.date_of_birth if profile else None,
        "preferences": profile.profile_preferences if profile else {},
        "created_at": current_user.created_at
    }

@router.patch("/profile")
def update_patient_profile(
    payload: Dict[str, Any],
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    if "full_name" in payload and payload["full_name"]:
        current_user.full_name = payload["full_name"].strip()
    if "date_of_birth" in payload:
        profile.date_of_birth = payload["date_of_birth"]
    if "preferences" in payload and isinstance(payload["preferences"], dict):
        profile.profile_preferences = payload["preferences"]

    db.commit()
    return {"message": "Profile updated successfully"}

@router.get("/assignments", response_model=List[AssessmentAssignmentResponse])
def get_patient_assignments(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    assignments = db.query(AssessmentAssignment).filter(
        AssessmentAssignment.patient_id == current_user.id
    ).order_by(desc(AssessmentAssignment.assigned_at)).all()

    result = []
    for a in assignments:
        result.append(AssessmentAssignmentResponse(
            id=a.id,
            assessment_id=a.assessment_id,
            patient_id=a.patient_id,
            patient_name=current_user.full_name,
            patient_email=current_user.email,
            assessment_title=a.assessment.title if a.assessment else "Assessment",
            assigned_at=a.assigned_at,
            due_date=a.due_date,
            status=a.status,
            instructions=a.instructions
        ))
    return result

@router.get("/scenarios", response_model=List[ScenarioResponse])
def get_patient_scenarios(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
    assigned_ids = {
        sa.scenario_id for sa in db.query(ScenarioAssignment).filter(
            ScenarioAssignment.patient_id == current_user.id
        ).all()
    }

    result = []
    for sc in scenarios:
        sc_dict = {
            "id": sc.id,
            "title": sc.title,
            "slug": sc.slug,
            "description": sc.description,
            "category": sc.category,
            "instructions": sc.instructions,
            "safety_notice": sc.safety_notice,
            "is_active": sc.is_active,
            "is_assigned": sc.id in assigned_ids,
            "videos": [
                {
                    "id": v.id,
                    "scenario_id": v.scenario_id,
                    "title": v.title,
                    "description": v.description,
                    "level": v.level,
                    "mime_type": v.mime_type,
                    "file_size": v.file_size,
                    "duration_seconds": v.duration_seconds,
                    "is_active": v.is_active,
                    "has_video_file": bool(v.file_path)
                } for v in sc.videos if v.is_active
            ]
        }
        result.append(ScenarioResponse(**sc_dict))
    return result

@router.get("/sessions", response_model=List[SessionResponse])
def get_patient_sessions(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    sessions = db.query(ExposureSession).filter(
        ExposureSession.patient_id == current_user.id
    ).order_by(desc(ExposureSession.started_at)).all()

    result = []
    for s in sessions:
        result.append(SessionResponse(
            id=s.id,
            patient_id=s.patient_id,
            patient_name=current_user.full_name,
            scenario_id=s.scenario_id,
            scenario_title=s.scenario.title if s.scenario else "Guided Scenario",
            video_id=s.video_id,
            video_title=s.video.title if s.video else "Scenario Video",
            started_at=s.started_at,
            completed_at=s.completed_at,
            duration_seconds=s.duration_seconds,
            pre_comfort_rating=s.pre_comfort_rating,
            post_comfort_rating=s.post_comfort_rating,
            reflection=s.reflection,
            status=s.status,
            created_at=s.created_at
        ))
    return result

@router.get("/reports", response_model=List[ReportResponse])
def get_patient_reports(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    # Patient can strictly ONLY see reports with status == "released"
    reports = db.query(Report).filter(
        Report.patient_id == current_user.id,
        Report.status == "released"
    ).order_by(desc(Report.released_at)).all()

    result = []
    for r in reports:
        result.append(ReportResponse(
            id=r.id,
            patient_id=r.patient_id,
            patient_name=current_user.full_name,
            assessment_attempt_id=r.assessment_attempt_id,
            session_id=r.session_id,
            title=r.title,
            ai_summary=r.ai_summary,
            reviewer_feedback=r.reviewer_feedback,
            practice_recommendations=r.practice_recommendations,
            status=r.status,
            reviewed_by=r.reviewed_by,
            reviewer_name=r.reviewer.full_name if r.reviewer else "Administrator",
            approved_at=r.approved_at,
            released_at=r.released_at,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return result

@router.get("/notifications", response_model=List[NotificationResponse])
def get_patient_notifications(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(20).all()
    return notifications

@router.post("/notifications/{id}/read")
def mark_notification_read(
    id: uuid.UUID,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}
