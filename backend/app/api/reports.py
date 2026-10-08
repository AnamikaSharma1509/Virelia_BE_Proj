import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.permissions import get_current_user, require_admin
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.models.user import User
from app.models.report import Report, AIAnalysis
from app.models.assessment import AssessmentAttempt
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.report import (
    ReportResponse,
    ReportDetailResponse,
    ReportUpdate
)

router = APIRouter(tags=["Reports"])

@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise NotFoundException("Report not found")

    # Patient security restriction
    if current_user.role == "patient":
        if report.patient_id != current_user.id:
            raise ForbiddenException("Access denied to another patient's report")
        if report.status != "released":
            raise ForbiddenException("This report has not yet been released by your administrator.")

    patient = db.query(User).filter(User.id == report.patient_id).first()
    reviewer = db.query(User).filter(User.id == report.reviewed_by).first() if report.reviewed_by else None

    # Assessment attempt details if linked
    assessment_data = None
    if report.assessment_attempt_id:
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == report.assessment_attempt_id).first()
        if attempt:
            assessment = attempt.assignment.assessment if attempt.assignment else None
            assessment_data = {
                "assessment_title": assessment.title if assessment else "Assessment",
                "percentage": attempt.percentage,
                "awarded_points": attempt.awarded_points,
                "total_points": attempt.total_points,
                "submitted_at": attempt.submitted_at
            }

    ai_analysis_dict = None
    if report.ai_analysis:
        ai_analysis_dict = {
            "id": report.ai_analysis.id,
            "patient_id": report.ai_analysis.patient_id,
            "provider": report.ai_analysis.provider,
            "model_name": report.ai_analysis.model_name,
            "analysis_type": report.ai_analysis.analysis_type,
            "analysis_json": report.ai_analysis.analysis_json,
            "status": report.ai_analysis.status,
            "error_summary": report.ai_analysis.error_summary,
            "created_at": report.ai_analysis.created_at
        }

    return ReportDetailResponse(
        id=report.id,
        patient_id=report.patient_id,
        patient_name=patient.full_name if patient else "Unknown",
        assessment_attempt_id=report.assessment_attempt_id,
        session_id=report.session_id,
        title=report.title,
        ai_summary=report.ai_summary,
        reviewer_feedback=report.reviewer_feedback,
        practice_recommendations=report.practice_recommendations,
        status=report.status,
        reviewed_by=report.reviewed_by,
        reviewer_name=reviewer.full_name if reviewer else "Administrator",
        approved_at=report.approved_at,
        released_at=report.released_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
        ai_analysis=ai_analysis_dict,
        assessment_data=assessment_data
    )

@router.get("/admin/reports", response_model=List[ReportResponse])
def admin_list_reports(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)

    reports = query.order_by(desc(Report.created_at)).all()
    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        reviewer = db.query(User).filter(User.id == r.reviewed_by).first() if r.reviewed_by else None
        result.append(ReportResponse(
            id=r.id,
            patient_id=r.patient_id,
            patient_name=patient.full_name if patient else "Unknown",
            assessment_attempt_id=r.assessment_attempt_id,
            session_id=r.session_id,
            title=r.title,
            ai_summary=r.ai_summary,
            reviewer_feedback=r.reviewer_feedback,
            practice_recommendations=r.practice_recommendations,
            status=r.status,
            reviewed_by=r.reviewed_by,
            reviewer_name=reviewer.full_name if reviewer else None,
            approved_at=r.approved_at,
            released_at=r.released_at,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return result

@router.patch("/admin/reports/{report_id}", response_model=ReportResponse)
def admin_update_report(
    report_id: uuid.UUID,
    req: ReportUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise NotFoundException("Report not found")

    if req.title is not None:
        report.title = req.title.strip()
    if req.ai_summary is not None:
        report.ai_summary = req.ai_summary.strip()
    if req.reviewer_feedback is not None:
        report.reviewer_feedback = req.reviewer_feedback.strip()
    if req.practice_recommendations is not None:
        report.practice_recommendations = req.practice_recommendations.strip()

    report.reviewed_by = current_admin.id
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)

    patient = db.query(User).filter(User.id == report.patient_id).first()
    return ReportResponse(
        id=report.id,
        patient_id=report.patient_id,
        patient_name=patient.full_name if patient else "Unknown",
        assessment_attempt_id=report.assessment_attempt_id,
        session_id=report.session_id,
        title=report.title,
        ai_summary=report.ai_summary,
        reviewer_feedback=report.reviewer_feedback,
        practice_recommendations=report.practice_recommendations,
        status=report.status,
        reviewed_by=report.reviewed_by,
        reviewer_name=current_admin.full_name,
        approved_at=report.approved_at,
        released_at=report.released_at,
        created_at=report.created_at,
        updated_at=report.updated_at
    )

@router.post("/admin/reports/{report_id}/approve")
def admin_approve_report(
    report_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise NotFoundException("Report not found")

    report.status = "approved"
    report.approved_at = datetime.utcnow()
    report.reviewed_by = current_admin.id
    db.commit()

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="report_approved",
        entity_type="reports",
        entity_id=str(report.id)
    )
    db.add(audit)
    db.commit()

    return {"message": "Report approved successfully"}

@router.post("/admin/reports/{report_id}/release")
def admin_release_report(
    report_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise NotFoundException("Report not found")

    report.status = "released"
    report.released_at = datetime.utcnow()
    report.reviewed_by = current_admin.id

    if report.assessment_attempt:
        report.assessment_attempt.status = "released"
        if report.assessment_attempt.assignment:
            report.assessment_attempt.assignment.status = "released"

    notif = Notification(
        id=uuid.uuid4(),
        user_id=report.patient_id,
        title="Practice Report Released",
        message=f"Your practice report '{report.title}' has been reviewed and released.",
        notification_type="report",
        related_entity_type="reports",
        related_entity_id=report.id
    )
    db.add(notif)

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="report_released",
        entity_type="reports",
        entity_id=str(report.id),
        metadata_json={"patient_id": str(report.patient_id)}
    )
    db.add(audit)
    db.commit()

    return {"message": "Report released to patient"}
