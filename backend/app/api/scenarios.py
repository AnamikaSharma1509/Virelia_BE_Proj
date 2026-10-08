import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.permissions import get_current_user, require_admin
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.user import User
from app.models.scenario import Scenario, ScenarioVideo, ScenarioAssignment
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.scenario import (
    ScenarioResponse,
    ScenarioCreate,
    ScenarioUpdate,
    ScenarioAssignmentCreate,
    ScenarioAssignmentResponse
)

router = APIRouter(tags=["Scenarios"])

@router.get("/scenarios", response_model=List[ScenarioResponse])
def list_scenarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
    assigned_ids = set()
    if current_user.role == "patient":
        assigned_ids = {
            sa.scenario_id for sa in db.query(ScenarioAssignment).filter(
                ScenarioAssignment.patient_id == current_user.id
            ).all()
        }

    result = []
    for sc in scenarios:
        result.append(ScenarioResponse(
            id=sc.id,
            title=sc.title,
            slug=sc.slug,
            description=sc.description,
            category=sc.category,
            instructions=sc.instructions,
            safety_notice=sc.safety_notice,
            is_active=sc.is_active,
            is_assigned=sc.id in assigned_ids if current_user.role == "patient" else True,
            videos=[{
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
            } for v in sc.videos if v.is_active]
        ))
    return result

@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse)
def get_scenario_detail(
    scenario_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sc = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not sc:
        raise NotFoundException("Scenario not found")

    is_assigned = True
    if current_user.role == "patient":
        sa = db.query(ScenarioAssignment).filter(
            ScenarioAssignment.scenario_id == sc.id,
            ScenarioAssignment.patient_id == current_user.id
        ).first()
        is_assigned = bool(sa)

    return ScenarioResponse(
        id=sc.id,
        title=sc.title,
        slug=sc.slug,
        description=sc.description,
        category=sc.category,
        instructions=sc.instructions,
        safety_notice=sc.safety_notice,
        is_active=sc.is_active,
        is_assigned=is_assigned,
        videos=[{
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
        } for v in sc.videos if v.is_active]
    )

@router.get("/admin/scenarios", response_model=List[ScenarioResponse])
def admin_list_scenarios(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    scenarios = db.query(Scenario).all()
    result = []
    for sc in scenarios:
        result.append(ScenarioResponse(
            id=sc.id,
            title=sc.title,
            slug=sc.slug,
            description=sc.description,
            category=sc.category,
            instructions=sc.instructions,
            safety_notice=sc.safety_notice,
            is_active=sc.is_active,
            is_assigned=True,
            videos=[{
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
            } for v in sc.videos]
        ))
    return result

@router.post("/admin/scenarios/{scenario_id}/assign")
def assign_scenario_to_patients(
    scenario_id: uuid.UUID,
    req: ScenarioAssignmentCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise NotFoundException("Scenario not found")

    assigned_count = 0
    for p_id in req.patient_ids:
        patient = db.query(User).filter(User.id == p_id, User.role == "patient").first()
        if not patient:
            continue

        existing = db.query(ScenarioAssignment).filter(
            ScenarioAssignment.scenario_id == scenario.id,
            ScenarioAssignment.patient_id == patient.id
        ).first()

        if not existing:
            sa = ScenarioAssignment(
                id=uuid.uuid4(),
                scenario_id=scenario.id,
                patient_id=patient.id,
                assigned_by=current_admin.id,
                status="assigned"
            )
            db.add(sa)
            assigned_count += 1

            notif = Notification(
                id=uuid.uuid4(),
                user_id=patient.id,
                title="Guided Scenario Assigned",
                message=f"You have been assigned the guided practice scenario '{scenario.title}'.",
                notification_type="assignment",
                related_entity_type="scenarios",
                related_entity_id=scenario.id
            )
            db.add(notif)

    db.commit()
    return {"message": f"Scenario assigned to {assigned_count} patient(s)"}

@router.get("/admin/scenario-assignments")
def admin_list_scenario_assignments(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assignments = db.query(ScenarioAssignment).order_by(ScenarioAssignment.assigned_at.desc()).all()
    result = []
    for sa in assignments:
        patient = db.query(User).filter(User.id == sa.patient_id).first()
        scenario = db.query(Scenario).filter(Scenario.id == sa.scenario_id).first()
        result.append({
            "id": sa.id,
            "scenario_id": sa.scenario_id,
            "scenario_title": scenario.title if scenario else "Scenario",
            "scenario_category": scenario.category if scenario else "",
            "patient_id": sa.patient_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "",
            "assigned_at": sa.assigned_at,
            "status": sa.status
        })
    return result

@router.delete("/admin/scenario-assignments/{assignment_id}")
def admin_revoke_scenario_assignment(
    assignment_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assignment = db.query(ScenarioAssignment).filter(ScenarioAssignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException("Scenario assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Scenario assignment revoked successfully"}
