import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.permissions import require_admin
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentAssignment
from app.schemas.assessment import (
    AssessmentAdminResponse,
    AssessmentCreate,
    AssessmentUpdate,
    QuestionCreate
)

router = APIRouter(prefix="/admin/assessments", tags=["Administrator Assessments"])

@router.get("", response_model=List[AssessmentAdminResponse])
def list_admin_assessments(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessments = db.query(Assessment).order_by(desc(Assessment.created_at)).all()
    return assessments

@router.post("", response_model=AssessmentAdminResponse)
def create_assessment(
    req: AssessmentCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = Assessment(
        id=uuid.uuid4(),
        title=req.title.strip(),
        description=req.description.strip(),
        instructions=req.instructions,
        category=req.category,
        estimated_duration=req.estimated_duration,
        is_published=req.is_published,
        created_by=current_admin.id
    )
    db.add(assessment)
    db.flush()

    if req.questions:
        for idx, q_in in enumerate(req.questions):
            q = AssessmentQuestion(
                id=uuid.uuid4(),
                assessment_id=assessment.id,
                question_text=q_in.question_text.strip(),
                question_type=q_in.question_type,
                options=q_in.options,
                correct_option=q_in.correct_option,
                points=q_in.points,
                is_required=q_in.is_required,
                order_index=q_in.order_index if q_in.order_index is not None else idx,
                rubric=q_in.rubric
            )
            db.add(q)

    db.commit()
    db.refresh(assessment)
    return assessment

@router.get("/{assessment_id}", response_model=AssessmentAdminResponse)
def get_assessment(
    assessment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")
    return assessment

@router.patch("/{assessment_id}", response_model=AssessmentAdminResponse)
def update_assessment(
    assessment_id: uuid.UUID,
    req: AssessmentUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")

    if req.title is not None:
        assessment.title = req.title.strip()
    if req.description is not None:
        assessment.description = req.description.strip()
    if req.instructions is not None:
        assessment.instructions = req.instructions
    if req.category is not None:
        assessment.category = req.category
    if req.estimated_duration is not None:
        assessment.estimated_duration = req.estimated_duration
    if req.is_published is not None:
        assessment.is_published = req.is_published

    if req.questions is not None:
        # Replace questions with updated set
        db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment.id).delete()
        for idx, q_in in enumerate(req.questions):
            q = AssessmentQuestion(
                id=uuid.uuid4(),
                assessment_id=assessment.id,
                question_text=q_in.question_text.strip(),
                question_type=q_in.question_type,
                options=q_in.options,
                correct_option=q_in.correct_option,
                points=q_in.points,
                is_required=q_in.is_required,
                order_index=q_in.order_index if q_in.order_index is not None else idx,
                rubric=q_in.rubric
            )
            db.add(q)

    assessment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assessment)
    return assessment

@router.post("/{assessment_id}/publish")
def publish_assessment(
    assessment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")
    if not assessment.questions:
        raise BadRequestException("Cannot publish an assessment with zero questions.")

    assessment.is_published = True
    db.commit()
    return {"message": "Assessment published successfully"}

@router.post("/{assessment_id}/archive")
def archive_assessment(
    assessment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")

    assessment.is_published = False
    db.commit()
    return {"message": "Assessment archived successfully"}

@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")

    db.delete(assessment)
    db.commit()
    return {"message": "Assessment deleted successfully"}
