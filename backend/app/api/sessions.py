import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.permissions import get_current_user, require_patient
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.models.user import User
from app.models.scenario import Scenario, ScenarioVideo, ScenarioAssignment
from app.models.session import ExposureSession, SessionEvent
from app.models.report import Report, AIAnalysis
from app.models.audit import AuditLog
from app.schemas.session import (
    SessionStartRequest,
    SessionEventRequest,
    SessionCompleteRequest,
    SessionStopRequest,
    SessionReflectionRequest,
    SessionResponse,
    SessionDetailResponse
)
from app.ai.service import get_ai_provider

router = APIRouter(prefix="/sessions", tags=["Exposure Sessions"])

@router.post("/start", response_model=SessionResponse)
def start_session(
    req: SessionStartRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    scenario = db.query(Scenario).filter(Scenario.id == req.scenario_id, Scenario.is_active == True).first()
    if not scenario:
        raise NotFoundException("Scenario not found or inactive")

    # Check assignment
    assignment = db.query(ScenarioAssignment).filter(
        ScenarioAssignment.scenario_id == scenario.id,
        ScenarioAssignment.patient_id == current_user.id
    ).first()
    if not assignment:
        raise ForbiddenException("This scenario has not been assigned to you by an administrator.")

    # Select video
    video_id = req.video_id
    if not video_id:
        first_video = db.query(ScenarioVideo).filter(
            ScenarioVideo.scenario_id == scenario.id,
            ScenarioVideo.is_active == True
        ).order_by(ScenarioVideo.level).first()
        video_id = first_video.id if first_video else None

    video = db.query(ScenarioVideo).filter(ScenarioVideo.id == video_id).first() if video_id else None

    session = ExposureSession(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        scenario_id=scenario.id,
        video_id=video.id if video else None,
        assignment_id=assignment.id,
        started_at=datetime.utcnow(),
        duration_seconds=0,
        pre_comfort_rating=req.pre_comfort_rating,
        status="in_progress"
    )
    db.add(session)
    db.flush()

    # Record initial event
    start_event = SessionEvent(
        id=uuid.uuid4(),
        session_id=session.id,
        event_type="session_started",
        event_timestamp=datetime.utcnow(),
        event_data={"pre_comfort_rating": req.pre_comfort_rating}
    )
    db.add(start_event)

    assignment.status = "in_progress"
    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=session.id,
        patient_id=session.patient_id,
        patient_name=current_user.full_name,
        scenario_id=session.scenario_id,
        scenario_title=scenario.title,
        video_id=session.video_id,
        video_title=video.title if video else None,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        pre_comfort_rating=session.pre_comfort_rating,
        post_comfort_rating=session.post_comfort_rating,
        reflection=session.reflection,
        status=session.status,
        created_at=session.created_at
    )

@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ExposureSession).filter(ExposureSession.id == session_id).first()
    if not session:
        raise NotFoundException("Exposure session not found")

    if current_user.role != "admin" and session.patient_id != current_user.id:
        raise ForbiddenException("Access denied to another patient's session")

    scenario = session.scenario
    video = session.video
    patient = session.patient_id

    events = [{
        "id": ev.id,
        "event_type": ev.event_type,
        "event_timestamp": ev.event_timestamp,
        "event_data": ev.event_data
    } for ev in session.events]

    return SessionDetailResponse(
        id=session.id,
        patient_id=session.patient_id,
        patient_name=session.patient_id and db.query(User).filter(User.id == session.patient_id).first().full_name,
        scenario_id=session.scenario_id,
        scenario_title=scenario.title if scenario else None,
        video_id=session.video_id,
        video_title=video.title if video else None,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        pre_comfort_rating=session.pre_comfort_rating,
        post_comfort_rating=session.post_comfort_rating,
        reflection=session.reflection,
        status=session.status,
        created_at=session.created_at,
        events=events
    )

@router.post("/{session_id}/events")
def record_session_event(
    session_id: uuid.UUID,
    req: SessionEventRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    session = db.query(ExposureSession).filter(
        ExposureSession.id == session_id,
        ExposureSession.patient_id == current_user.id
    ).first()
    if not session:
        raise NotFoundException("Session not found")

    event = SessionEvent(
        id=uuid.uuid4(),
        session_id=session.id,
        event_type=req.event_type,
        event_timestamp=datetime.utcnow(),
        event_data=req.event_data or {}
    )
    db.add(event)
    db.commit()
    return {"message": "Event recorded", "event_id": str(event.id)}

@router.post("/{session_id}/complete", response_model=SessionResponse)
def complete_session(
    session_id: uuid.UUID,
    req: SessionCompleteRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    session = db.query(ExposureSession).filter(
        ExposureSession.id == session_id,
        ExposureSession.patient_id == current_user.id
    ).first()
    if not session:
        raise NotFoundException("Session not found")

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.post_comfort_rating = req.post_comfort_rating
    session.duration_seconds = req.duration_seconds
    if req.reflection:
        session.reflection = req.reflection.strip()

    event = SessionEvent(
        id=uuid.uuid4(),
        session_id=session.id,
        event_type="session_completed",
        event_timestamp=datetime.utcnow(),
        event_data={
            "post_comfort_rating": req.post_comfort_rating,
            "duration_seconds": req.duration_seconds
        }
    )
    db.add(event)

    # Optional AI session factual summary
    ai_provider = get_ai_provider()
    session_data = {
        "scenario_title": session.scenario.title if session.scenario else "Scenario",
        "video_title": session.video.title if session.video else "Video",
        "duration_seconds": req.duration_seconds,
        "pre_comfort_rating": session.pre_comfort_rating,
        "post_comfort_rating": req.post_comfort_rating,
        "reflection": session.reflection,
        "status": "completed"
    }
    ai_summary = ai_provider.summarize_exposure_session(session_data)

    ai_analysis = AIAnalysis(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        session_id=session.id,
        provider="local_fallback",
        model_name="virelia-assist-v1",
        analysis_type="exposure_session",
        analysis_json=ai_summary,
        status="completed"
    )
    db.add(ai_analysis)

    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=session.id,
        patient_id=session.patient_id,
        patient_name=current_user.full_name,
        scenario_id=session.scenario_id,
        scenario_title=session.scenario.title if session.scenario else None,
        video_id=session.video_id,
        video_title=session.video.title if session.video else None,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        pre_comfort_rating=session.pre_comfort_rating,
        post_comfort_rating=session.post_comfort_rating,
        reflection=session.reflection,
        status=session.status,
        created_at=session.created_at
    )

@router.post("/{session_id}/stop", response_model=SessionResponse)
def stop_session(
    session_id: uuid.UUID,
    req: SessionStopRequest,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    session = db.query(ExposureSession).filter(
        ExposureSession.id == session_id,
        ExposureSession.patient_id == current_user.id
    ).first()
    if not session:
        raise NotFoundException("Session not found")

    session.status = "interrupted"
    session.completed_at = datetime.utcnow()
    if req.post_comfort_rating is not None:
        session.post_comfort_rating = req.post_comfort_rating
    if req.duration_seconds is not None:
        session.duration_seconds = req.duration_seconds
    if req.reflection:
        session.reflection = req.reflection.strip()

    event = SessionEvent(
        id=uuid.uuid4(),
        session_id=session.id,
        event_type="session_stopped_by_user",
        event_timestamp=datetime.utcnow(),
        event_data={"duration_seconds": req.duration_seconds}
    )
    db.add(event)
    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=session.id,
        patient_id=session.patient_id,
        patient_name=current_user.full_name,
        scenario_id=session.scenario_id,
        scenario_title=session.scenario.title if session.scenario else None,
        video_id=session.video_id,
        video_title=session.video.title if session.video else None,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        pre_comfort_rating=session.pre_comfort_rating,
        post_comfort_rating=session.post_comfort_rating,
        reflection=session.reflection,
        status=session.status,
        created_at=session.created_at
    )
