import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ScenarioVideoResponse(BaseModel):
    id: uuid.UUID
    scenario_id: uuid.UUID
    title: str
    description: Optional[str] = None
    level: int
    mime_type: str
    file_size: int
    duration_seconds: int
    is_active: bool
    has_video_file: bool = False

    class Config:
        from_attributes = True

class ScenarioResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str
    category: str
    instructions: Optional[str] = None
    safety_notice: Optional[str] = None
    is_active: bool
    is_assigned: bool = False
    videos: List[ScenarioVideoResponse] = []

    class Config:
        from_attributes = True

class ScenarioCreate(BaseModel):
    title: str = Field(..., min_length=3)
    slug: str
    description: str
    category: str
    instructions: Optional[str] = None
    safety_notice: Optional[str] = None
    is_active: bool = True

class ScenarioUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    safety_notice: Optional[str] = None
    is_active: Optional[bool] = None

class ScenarioAssignmentCreate(BaseModel):
    scenario_id: uuid.UUID
    patient_ids: List[uuid.UUID]
    due_date: Optional[datetime] = None

class ScenarioAssignmentResponse(BaseModel):
    id: uuid.UUID
    scenario_id: uuid.UUID
    scenario_title: Optional[str] = None
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    assigned_at: datetime
    due_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
