import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=3)
    question_type: str = Field(..., description="'mcq' or 'written'")
    options: Optional[List[str]] = None
    correct_option: Optional[str] = None
    points: float = 1.0
    is_required: bool = True
    order_index: int = 0
    rubric: Optional[dict] = None

class QuestionPatientResponse(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    points: float
    is_required: bool
    order_index: int

    class Config:
        from_attributes = True

class QuestionAdminResponse(QuestionPatientResponse):
    correct_option: Optional[str] = None
    rubric: Optional[dict] = None

class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    instructions: Optional[str] = None
    category: str = "General Confidence"
    estimated_duration: int = 15
    is_published: bool = False
    questions: Optional[List[QuestionCreate]] = None

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    category: Optional[str] = None
    estimated_duration: Optional[int] = None
    is_published: Optional[bool] = None
    questions: Optional[List[QuestionCreate]] = None

class AssessmentPatientResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    instructions: Optional[str] = None
    category: str
    estimated_duration: int
    is_published: bool
    questions: List[QuestionPatientResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class AssessmentAdminResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    instructions: Optional[str] = None
    category: str
    estimated_duration: int
    is_published: bool
    questions: List[QuestionAdminResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssessmentAssignmentCreate(BaseModel):
    assessment_id: uuid.UUID
    patient_ids: List[uuid.UUID]
    due_date: Optional[datetime] = None
    instructions: Optional[str] = None

class AssessmentAssignmentResponse(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    assessment_title: Optional[str] = None
    assigned_at: datetime
    due_date: Optional[datetime] = None
    status: str
    instructions: Optional[str] = None

    class Config:
        from_attributes = True

class AnswerItem(BaseModel):
    question_id: uuid.UUID
    selected_option: Optional[str] = None
    written_answer: Optional[str] = None

class AttemptSubmitRequest(BaseModel):
    answers: List[AnswerItem]

class AnswerResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    selected_option: Optional[str] = None
    written_answer: Optional[str] = None
    awarded_points: float = 0.0
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True

class AttemptResponse(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    patient_id: uuid.UUID
    started_at: datetime
    submitted_at: Optional[datetime] = None
    status: str
    total_points: float
    awarded_points: float
    percentage: float
    answers: List[AnswerResponse] = []

    class Config:
        from_attributes = True
