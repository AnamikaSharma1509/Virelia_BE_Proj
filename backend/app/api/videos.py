import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.permissions import get_current_user, require_admin
from app.core.security import decode_token
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.models.user import User
from app.models.scenario import Scenario, ScenarioVideo, ScenarioAssignment
from app.storage.local_storage import get_safe_media_path, stream_video_file
from app.schemas.scenario import ScenarioVideoResponse

router = APIRouter(tags=["Videos"])

def get_user_from_stream_request(request: Request, db: Session) -> User:
    """
    Authenticate video stream via Authorization header or query parameter 'token'
    for browser HTML5 <video> elements.
    """
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing video authorization token")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid video streaming token")

    user_id_str = payload.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id_str)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unauthorized")

    return user

@router.get("/videos/{video_id}/stream")
def stream_video(
    video_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_user_from_stream_request(request, db)
    video = db.query(ScenarioVideo).filter(ScenarioVideo.id == video_id).first()
    if not video:
        raise NotFoundException("Video not found")

    # If patient, verify that scenario is assigned to this patient
    if user.role == "patient":
        assignment = db.query(ScenarioAssignment).filter(
            ScenarioAssignment.scenario_id == video.scenario_id,
            ScenarioAssignment.patient_id == user.id
        ).first()
        if not assignment:
            raise ForbiddenException("This scenario video has not been assigned to your account.")

    if not video.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unity video file is not yet uploaded or configured for this level."
        )

    safe_path = get_safe_media_path(video.file_path)
    return stream_video_file(safe_path, request)

@router.get("/admin/videos", response_model=List[ScenarioVideoResponse])
def admin_list_videos(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    videos = db.query(ScenarioVideo).order_by(ScenarioVideo.scenario_id, ScenarioVideo.level).all()
    result = []
    for v in videos:
        has_file = False
        if v.file_path:
            try:
                full_path = get_safe_media_path(v.file_path)
                has_file = os.path.isfile(full_path)
            except Exception:
                has_file = False

        result.append(ScenarioVideoResponse(
            id=v.id,
            scenario_id=v.scenario_id,
            title=v.title,
            description=v.description,
            level=v.level,
            mime_type=v.mime_type,
            file_size=v.file_size,
            duration_seconds=v.duration_seconds,
            is_active=v.is_active,
            has_video_file=has_file
        ))
    return result

@router.post("/admin/videos/upload")
def upload_video_file(
    video_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    video = db.query(ScenarioVideo).filter(ScenarioVideo.id == video_id).first()
    if not video:
        raise NotFoundException("Scenario video slot not found")

    if not file.filename.lower().endswith((".mp4", ".m4v", ".webm")):
        raise BadRequestException("Only MP4 or WebM video files are permitted.")

    scenario = video.scenario
    category_slug = scenario.slug.replace("-", "_") if scenario else "common"
    dest_dir = os.path.join(settings.MEDIA_ROOT, "scenarios", category_slug)
    os.makedirs(dest_dir, exist_ok=True)

    dest_filename = f"{scenario.slug}_level_{video.level}.mp4"
    dest_full_path = os.path.join(dest_dir, dest_filename)

    with open(dest_full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_full_path)
    rel_path = os.path.relpath(dest_full_path, settings.MEDIA_ROOT).replace("\\", "/")

    video.file_path = rel_path
    video.file_size = file_size
    video.mime_type = file.content_type or "video/mp4"
    db.commit()

    return {
        "message": "Video uploaded successfully",
        "video_id": str(video.id),
        "file_path": rel_path,
        "file_size": file_size
    }
