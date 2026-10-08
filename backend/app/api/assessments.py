import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.permissions import get_current_user, require_patient
from app.core.exceptions import ForbiddenException, NotFoundException, BadRequestException
from app.models.user import User
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentAssignment, AssessmentAttempt, AssessmentAnswer
from app.models.report import AIAnalysis, Report
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.assessment import (
    AssessmentPatientResponse,
    AttemptSubmitRequest,
    AttemptResponse,
    AnswerResponse
)
from app.ai.service import get_ai_provider

router = APIRouter(tags=["Assessments"])

@router.get("/assessments/{assessment_id}", response_model=AssessmentPatientResponse)
def get_assessment_for_patient(
    assessment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")

    if not assessment.is_published and current_user.role != "admin":
        raise ForbiddenException("This assessment is not yet published")

    # Correct options are omitted from AssessmentPatientResponse
    return assessment

@router.post("/assignments/{assignment_id}/start", response_model=AttemptResponse)
def start_or_resume_assessment_attempt(
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    assignment = db.query(AssessmentAssignment).filter(
        AssessmentAssignment.id == assignment_id,
        AssessmentAssignment.patient_id == current_user.id
    ).first()
    if not assignment:
        raise NotFoundException("Assignment not found for current patient")

    # Check for existing attempt
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assignment_id == assignment.id,
        AssessmentAttempt.patient_id == current_user.id
    ).order_by(AssessmentAttempt.created_at.desc()).first()

    if attempt and attempt.status == "in_progress":
        return attempt

    if attempt and attempt.status in ["submitted", "under_review", "approved", "released"]:
        # Already submitted
        return attempt

    # Calculate total points possible
    assessment = assignment.assessment
    total_points = sum(q.points for q in assessment.questions)

    attempt = AssessmentAttempt(
        id=uuid.uuid4(),
        assignment_id=assignment.id,
        patient_id=current_user.id,
        started_at=datetime.utcnow(),
        status="in_progress",
        total_points=total_points,
        awarded_points=0.0,
        percentage=0.0
    )
    db.add(attempt)
    assignment.status = "in_progress"
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/assignments/{assignment_id}/attempt", response_model=AttemptResponse)
def get_current_attempt(
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assignment_id == assignment_id,
        AssessmentAttempt.patient_id == current_user.id
    ).order_by(AssessmentAttempt.created_at.desc()).first()

    if not attempt:
        raise NotFoundException("No active attempt found for this assignment")
    return attempt

@router.put("/attempts/{attempt_id}/answers")
def save_draft_answers(
    attempt_id: uuid.UUID,
    req: AttemptSubmitRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == attempt_id,
        AssessmentAttempt.patient_id == current_user.id
    ).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    if attempt.status != "in_progress":
        raise BadRequestException("Cannot edit answers of a submitted attempt")

    for ans_in in req.answers:
        existing_answer = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.attempt_id == attempt.id,
            AssessmentAnswer.question_id == ans_in.question_id
        ).first()

        if existing_answer:
            existing_answer.selected_option = ans_in.selected_option
            existing_answer.written_answer = ans_in.written_answer
        else:
            new_ans = AssessmentAnswer(
                id=uuid.uuid4(),
                attempt_id=attempt.id,
                question_id=ans_in.question_id,
                selected_option=ans_in.selected_option,
                written_answer=ans_in.written_answer
            )
            db.add(new_ans)

    db.commit()
    return {"message": "Draft answers autosaved successfully"}

@router.post("/attempts/{attempt_id}/submit", response_model=AttemptResponse)
def submit_assessment_attempt(
    attempt_id: uuid.UUID,
    req: AttemptSubmitRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == attempt_id,
        AssessmentAttempt.patient_id == current_user.id
    ).first()
    if not attempt:
        raise NotFoundException("Attempt not found")

    if attempt.status != "in_progress":
        raise BadRequestException("This attempt has already been submitted.")

    assessment = attempt.assignment.assessment
    questions_map = {q.id: q for q in assessment.questions}

    # 1. Deterministic MCQ scoring on backend
    awarded_points = 0.0
    total_possible = sum(q.points for q in assessment.questions)
    written_data_for_ai = []

    for ans_in in req.answers:
        q = questions_map.get(ans_in.question_id)
        if not q:
            continue

        is_correct = None
        points_earned = 0.0

        if q.question_type == "mcq":
            if q.correct_option and ans_in.selected_option:
                if ans_in.selected_option.strip() == q.correct_option.strip():
                    is_correct = True
                    points_earned = q.points
                    awarded_points += q.points
                else:
                    is_correct = False
                    points_earned = 0.0

        elif q.question_type == "written":
            if ans_in.written_answer:
                written_data_for_ai.append({
                    "question_text": q.question_text,
                    "written_answer": ans_in.written_answer
                })

        existing_answer = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.attempt_id == attempt.id,
            AssessmentAnswer.question_id == q.id
        ).first()

        if existing_answer:
            existing_answer.selected_option = ans_in.selected_option
            existing_answer.written_answer = ans_in.written_answer
            existing_answer.is_correct = is_correct
            existing_answer.awarded_points = points_earned
        else:
            new_ans = AssessmentAnswer(
                id=uuid.uuid4(),
                attempt_id=attempt.id,
                question_id=q.id,
                selected_option=ans_in.selected_option,
                written_answer=ans_in.written_answer,
                is_correct=is_correct,
                awarded_points=points_earned
            )
            db.add(new_ans)

    attempt.awarded_points = awarded_points
    attempt.total_points = total_possible
    attempt.percentage = round((awarded_points / total_possible * 100), 1) if total_possible > 0 else 0.0
    attempt.submitted_at = datetime.utcnow()
    attempt.status = "under_review"
    attempt.assignment.status = "under_review"

    db.flush()

    # 2. AI-assisted analysis of written answers (with fallback if external fails)
    ai_provider = get_ai_provider()
    analysis_result = ai_provider.analyze_written_assessment(written_data_for_ai)

    ai_analysis = AIAnalysis(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        assessment_attempt_id=attempt.id,
        provider="local_fallback" if "fallback" in str(type(ai_provider)).lower() else "openai",
        model_name="virelia-assist-v1",
        analysis_type="assessment_written",
        analysis_json=analysis_result,
        status="completed"
    )
    db.add(ai_analysis)
    db.flush()

    # 3. Create Draft Report (Awaiting Doctor Review)
    report_title = f"{assessment.title} - Assessment Report"
    initial_summary = analysis_result.get("summary", "Assessment answers submitted.")

    draft_report = Report(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        assessment_attempt_id=attempt.id,
        ai_analysis_id=ai_analysis.id,
        title=report_title,
        ai_summary=initial_summary,
        reviewer_feedback="Pending clinical / administrator review.",
        practice_recommendations="Recommended: Explore introductory Level 1 Guided Scenarios.",
        status="awaiting_review"
    )
    db.add(draft_report)

    # 4. Notify Administrator
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        notif = Notification(
            id=uuid.uuid4(),
            user_id=admin.id,
            title="New Assessment Awaiting Review",
            message=f"{current_user.full_name} submitted '{assessment.title}'. Review required before release.",
            notification_type="review",
            related_entity_type="assessment_attempts",
            related_entity_id=attempt.id
        )
        db.add(notif)

    # 5. Audit Log
    audit = AuditLog(
        actor_user_id=current_user.id,
        action="assessment_submitted",
        entity_type="assessment_attempts",
        entity_id=str(attempt.id),
        metadata_json={
            "assessment_id": str(assessment.id),
            "percentage": attempt.percentage,
            "awarded_points": attempt.awarded_points
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/attempts/{attempt_id}/status")
def get_attempt_status(
    attempt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise NotFoundException("Attempt not found")
    if current_user.role != "admin" and attempt.patient_id != current_user.id:
        raise ForbiddenException("Access denied")
    return {
        "id": attempt.id,
        "status": attempt.status,
        "submitted_at": attempt.submitted_at,
        "percentage": attempt.percentage
    }
