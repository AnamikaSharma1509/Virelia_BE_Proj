import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from app.db.session import get_db
from app.core.permissions import require_admin
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.assessment import Assessment, AssessmentAttempt, AssessmentAnswer
from app.models.report import Report, AIAnalysis
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.ai.service import get_ai_provider

router = APIRouter(prefix="/admin/submissions", tags=["Assessment Review Queue"])

class ReviewSubmissionRequest(BaseModel):
    reviewer_feedback: str
    practice_recommendations: Optional[str] = None
    ai_summary: Optional[str] = None

@router.get("")
def list_submissions(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.status.in_(["submitted", "under_review", "approved", "released"])
    )

    if status_filter:
        query = query.filter(AssessmentAttempt.status == status_filter)

    attempts = query.order_by(desc(AssessmentAttempt.submitted_at)).all()

    result = []
    for att in attempts:
        patient = db.query(User).filter(User.id == att.patient_id).first()
        assessment = att.assignment.assessment if att.assignment else None
        report = db.query(Report).filter(Report.assessment_attempt_id == att.id).first()

        result.append({
            "attempt_id": str(att.id),
            "patient_id": str(att.patient_id),
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "",
            "assessment_id": str(assessment.id) if assessment else None,
            "assessment_title": assessment.title if assessment else "Assessment",
            "submitted_at": att.submitted_at,
            "status": att.status,
            "percentage": att.percentage,
            "awarded_points": att.awarded_points,
            "total_points": att.total_points,
            "report_id": str(report.id) if report else None,
            "report_status": report.status if report else "none"
        })
    return result

@router.get("/{attempt_id}")
def get_submission_detail(
    attempt_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Assessment submission attempt not found")

    patient = db.query(User).filter(User.id == attempt.patient_id).first()
    assessment = attempt.assignment.assessment if attempt.assignment else None
    ai_analysis = db.query(AIAnalysis).filter(AIAnalysis.assessment_attempt_id == attempt.id).first()
    report = db.query(Report).filter(Report.assessment_attempt_id == attempt.id).first()

    # Answers with question metadata
    answers_data = []
    for ans in attempt.answers:
        q = ans.question
        answers_data.append({
            "question_id": str(q.id) if q else None,
            "question_text": q.question_text if q else "Question",
            "question_type": q.question_type if q else "mcq",
            "points": q.points if q else 1.0,
            "correct_option": q.correct_option if q else None,
            "selected_option": ans.selected_option,
            "written_answer": ans.written_answer,
            "is_correct": ans.is_correct,
            "awarded_points": ans.awarded_points
        })

    return {
        "attempt_id": str(attempt.id),
        "status": attempt.status,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "total_points": attempt.total_points,
        "awarded_points": attempt.awarded_points,
        "percentage": attempt.percentage,
        "patient": {
            "id": str(patient.id) if patient else None,
            "full_name": patient.full_name if patient else "Unknown",
            "email": patient.email if patient else ""
        },
        "assessment": {
            "id": str(assessment.id) if assessment else None,
            "title": assessment.title if assessment else "",
            "category": assessment.category if assessment else ""
        },
        "answers": answers_data,
        "ai_analysis": {
            "id": str(ai_analysis.id) if ai_analysis else None,
            "provider": ai_analysis.provider if ai_analysis else "local",
            "model_name": ai_analysis.model_name if ai_analysis else "fallback",
            "analysis_json": ai_analysis.analysis_json if ai_analysis else {},
            "status": ai_analysis.status if ai_analysis else "none"
        } if ai_analysis else None,
        "report": {
            "id": str(report.id) if report else None,
            "title": report.title if report else "",
            "ai_summary": report.ai_summary if report else "",
            "reviewer_feedback": report.reviewer_feedback if report else "",
            "practice_recommendations": report.practice_recommendations if report else "",
            "status": report.status if report else "draft",
            "approved_at": report.approved_at,
            "released_at": report.released_at
        } if report else None
    }

@router.post("/{attempt_id}/analyze")
def trigger_ai_analysis(
    attempt_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    written_answers = [
        {"question_text": ans.question.question_text if ans.question else "", "written_answer": ans.written_answer}
        for ans in attempt.answers if ans.written_answer
    ]

    ai_provider = get_ai_provider()
    analysis_result = ai_provider.analyze_written_assessment(written_answers)

    ai_analysis = db.query(AIAnalysis).filter(AIAnalysis.assessment_attempt_id == attempt.id).first()
    if not ai_analysis:
        ai_analysis = AIAnalysis(
            id=uuid.uuid4(),
            patient_id=attempt.patient_id,
            assessment_attempt_id=attempt.id,
            provider="local_fallback",
            model_name="virelia-assist-v1",
            analysis_type="assessment_written",
            analysis_json=analysis_result,
            status="completed"
        )
        db.add(ai_analysis)
    else:
        ai_analysis.analysis_json = analysis_result
        ai_analysis.updated_at = datetime.utcnow()

    # Update draft report if present
    report = db.query(Report).filter(Report.assessment_attempt_id == attempt.id).first()
    if report:
        report.ai_summary = analysis_result.get("summary", report.ai_summary)
        report.ai_analysis_id = ai_analysis.id

    db.commit()
    return {"message": "AI analysis regenerated successfully", "analysis": analysis_result}

@router.post("/{attempt_id}/review")
def review_submission(
    attempt_id: uuid.UUID,
    req: ReviewSubmissionRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    report = db.query(Report).filter(Report.assessment_attempt_id == attempt.id).first()
    if not report:
        report = Report(
            id=uuid.uuid4(),
            patient_id=attempt.patient_id,
            assessment_attempt_id=attempt.id,
            title="Assessment Practice Report",
            status="awaiting_review"
        )
        db.add(report)

    report.reviewer_feedback = req.reviewer_feedback.strip()
    if req.practice_recommendations:
        report.practice_recommendations = req.practice_recommendations.strip()
    if req.ai_summary:
        report.ai_summary = req.ai_summary.strip()
    report.reviewed_by = current_admin.id

    db.commit()
    return {"message": "Review and feedback saved successfully"}

@router.post("/{attempt_id}/approve")
def approve_submission(
    attempt_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    report = db.query(Report).filter(Report.assessment_attempt_id == attempt.id).first()
    if not report:
        raise BadRequestException("Cannot approve submission: No report exists yet.")

    report.status = "approved"
    report.approved_at = datetime.utcnow()
    report.reviewed_by = current_admin.id

    attempt.status = "approved"
    if attempt.assignment:
        attempt.assignment.status = "approved"

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="report_approved",
        entity_type="reports",
        entity_id=str(report.id),
        metadata_json={"attempt_id": str(attempt.id)}
    )
    db.add(audit)
    db.commit()
    return {"message": "Report approved. Ready for release to patient."}

@router.post("/{attempt_id}/release")
def release_submission_report(
    attempt_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    report = db.query(Report).filter(Report.assessment_attempt_id == attempt.id).first()
    if not report:
        raise BadRequestException("No report exists to release.")

    if report.status != "approved":
        report.status = "approved"
        report.approved_at = datetime.utcnow()
        report.reviewed_by = current_admin.id

    report.status = "released"
    report.released_at = datetime.utcnow()

    attempt.status = "released"
    if attempt.assignment:
        attempt.assignment.status = "released"

    # Notify Patient in-app
    patient_notif = Notification(
        id=uuid.uuid4(),
        user_id=attempt.patient_id,
        title="Assessment Report Released",
        message=f"Your practice report for '{report.title}' has been reviewed and is now available in My Reports.",
        notification_type="report",
        related_entity_type="reports",
        related_entity_id=report.id
    )
    db.add(patient_notif)

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="report_released",
        entity_type="reports",
        entity_id=str(report.id),
        metadata_json={"patient_id": str(attempt.patient_id), "released_at": report.released_at.isoformat()}
    )
    db.add(audit)
    db.commit()

    return {"message": "Report released to patient successfully"}
