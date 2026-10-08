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
from app.models.assessment import Assessment, AssessmentAssignment
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.assessment import AssessmentAssignmentCreate, AssessmentAssignmentResponse

router = APIRouter(prefix="/admin/assignments", tags=["Assessment Assignments"])

@router.get("", response_model=List[AssessmentAssignmentResponse])
def list_assignments(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assignments = db.query(AssessmentAssignment).order_by(desc(AssessmentAssignment.assigned_at)).all()
    result = []
    for a in assignments:
        patient = db.query(User).filter(User.id == a.patient_id).first()
        result.append(AssessmentAssignmentResponse(
            id=a.id,
            assessment_id=a.assessment_id,
            patient_id=a.patient_id,
            patient_name=patient.full_name if patient else "Unknown",
            patient_email=patient.email if patient else "",
            assessment_title=a.assessment.title if a.assessment else "Assessment",
            assigned_at=a.assigned_at,
            due_date=a.due_date,
            status=a.status,
            instructions=a.instructions
        ))
    return result

@router.post("", response_model=List[AssessmentAssignmentResponse])
def create_assignments(
    req: AssessmentAssignmentCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise NotFoundException("Assessment not found")

    if not req.patient_ids:
        raise BadRequestException("At least one patient must be selected for assignment.")

    created_assignments = []
    for p_id in req.patient_ids:
        patient = db.query(User).filter(User.id == p_id, User.role == "patient").first()
        if not patient:
            continue

        # Check existing active assignment
        existing = db.query(AssessmentAssignment).filter(
            AssessmentAssignment.assessment_id == assessment.id,
            AssessmentAssignment.patient_id == patient.id,
            AssessmentAssignment.status.in_(["assigned", "in_progress"])
        ).first()

        if existing:
            created_assignments.append(existing)
            continue

        assignment = AssessmentAssignment(
            id=uuid.uuid4(),
            assessment_id=assessment.id,
            patient_id=patient.id,
            assigned_by=current_admin.id,
            assigned_at=datetime.utcnow(),
            due_date=req.due_date,
            instructions=req.instructions,
            status="assigned"
        )
        db.add(assignment)
        db.flush()

        # In-app notification for patient
        notif = Notification(
            id=uuid.uuid4(),
            user_id=patient.id,
            title="New Assessment Assigned",
            message=f"You have been assigned '{assessment.title}'. Visit My Assessments to begin.",
            notification_type="assignment",
            related_entity_type="assessment_assignments",
            related_entity_id=assignment.id
        )
        db.add(notif)
        created_assignments.append(assignment)

    audit = AuditLog(
        actor_user_id=current_admin.id,
        action="assessment_assigned_bulk",
        entity_type="assessments",
        entity_id=str(assessment.id),
        metadata_json={"count": len(created_assignments), "patient_ids": [str(pid) for pid in req.patient_ids]}
    )
    db.add(audit)
    db.commit()

    result = []
    for a in created_assignments:
        patient = db.query(User).filter(User.id == a.patient_id).first()
        result.append(AssessmentAssignmentResponse(
            id=a.id,
            assessment_id=a.assessment_id,
            patient_id=a.patient_id,
            patient_name=patient.full_name if patient else "Unknown",
            patient_email=patient.email if patient else "",
            assessment_title=assessment.title,
            assigned_at=a.assigned_at,
            due_date=a.due_date,
            status=a.status,
            instructions=a.instructions
        ))
    return result

@router.delete("/{assignment_id}")
def revoke_assignment(
    assignment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assignment = db.query(AssessmentAssignment).filter(AssessmentAssignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException("Assignment not found")

    if assignment.status in ["submitted", "approved", "released"]:
        raise BadRequestException("Cannot revoke an assignment that has already been submitted or completed.")

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment revoked successfully"}
