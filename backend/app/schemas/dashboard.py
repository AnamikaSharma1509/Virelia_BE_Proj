import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class PatientDashboardResponse(BaseModel):
    first_name: str
    pending_assessments_count: int
    completed_assessments_count: int
    assigned_scenarios_count: int
    completed_sessions_count: int
    released_reports_count: int
    recent_activities: List[Dict[str, Any]] = []
    comfort_trends: List[Dict[str, Any]] = []

class AdminDashboardResponse(BaseModel):
    total_patients: int
    active_patients: int
    pending_assessments: int
    submitted_awaiting_review: int
    reports_awaiting_approval: int
    completed_sessions: int
    scenario_overview: List[Dict[str, Any]] = []
    reports_overview: Dict[str, int] = {}
    pending_queue: List[Dict[str, Any]] = []
    recent_activity: List[Dict[str, Any]] = []

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
