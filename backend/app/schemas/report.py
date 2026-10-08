import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AIAnalysisResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    provider: str
    model_name: str
    analysis_type: str
    analysis_json: Dict[str, Any]
    status: str
    error_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    ai_summary: Optional[str] = None
    reviewer_feedback: Optional[str] = None
    practice_recommendations: Optional[str] = None

class ReportResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    assessment_attempt_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None
    title: str
    ai_summary: Optional[str] = None
    reviewer_feedback: Optional[str] = None
    practice_recommendations: Optional[str] = None
    status: str
    reviewed_by: Optional[uuid.UUID] = None
    reviewer_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    ai_analysis: Optional[AIAnalysisResponse] = None
    assessment_data: Optional[Dict[str, Any]] = None
    session_data: Optional[Dict[str, Any]] = None
