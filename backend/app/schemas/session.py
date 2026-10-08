import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SessionStartRequest(BaseModel):
    scenario_id: uuid.UUID
    video_id: Optional[uuid.UUID] = None
    pre_comfort_rating: int = Field(..., ge=1, le=10, description="Pre-session comfort rating (1-10)")

class SessionEventRequest(BaseModel):
    event_type: str = Field(..., max_length=100)
    event_data: Optional[Dict[str, Any]] = None

class SessionStopRequest(BaseModel):
    post_comfort_rating: Optional[int] = Field(None, ge=1, le=10)
    reflection: Optional[str] = None
    duration_seconds: Optional[int] = 0

class SessionCompleteRequest(BaseModel):
    post_comfort_rating: int = Field(..., ge=1, le=10)
    reflection: Optional[str] = None
    duration_seconds: int = 0

class SessionReflectionRequest(BaseModel):
    post_comfort_rating: Optional[int] = Field(None, ge=1, le=10)
    reflection: str

class SessionEventResponse(BaseModel):
    id: uuid.UUID
    event_type: str
    event_timestamp: datetime
    event_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    scenario_id: uuid.UUID
    scenario_title: Optional[str] = None
    video_id: Optional[uuid.UUID] = None
    video_title: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: int
    pre_comfort_rating: Optional[int] = None
    post_comfort_rating: Optional[int] = None
    reflection: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionDetailResponse(SessionResponse):
    events: List[SessionEventResponse] = []
