"""Pydantic v2 models for the Barangay Health Center system.

Every model here has a hand-written TS mirror in frontend/src/lib/types.ts.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------- users
class UserBase(BaseModel):
    full_name: str
    username: str
    role: str = "health_worker"  # administrator | health_worker
    status: str = "active"  # active | inactive


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: str = Field(default_factory=_uid)
    created_at: datetime = Field(default_factory=_now)


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------------------------------------------------------------- patients
class PatientBase(BaseModel):
    full_name: str
    birth_date: str  # ISO yyyy-mm-dd
    sex: str  # Male | Female
    civil_status: str = "Single"
    contact_number: str = ""
    address: str = ""
    blood_type: str = "Unknown"
    occupation: str = ""
    philhealth_number: str = ""
    patient_type: str = "general"  # general | maternal | pediatric | senior


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    sex: Optional[str] = None
    civil_status: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    blood_type: Optional[str] = None
    occupation: Optional[str] = None
    philhealth_number: Optional[str] = None
    patient_type: Optional[str] = None


class Patient(PatientBase):
    id: str = Field(default_factory=_uid)
    patient_id: str
    age: int = 0
    registered_by: str = ""
    created_at: datetime = Field(default_factory=_now)


class PatientPage(BaseModel):
    items: List[Patient]
    total: int
    page: int
    pages: int


# ---------------------------------------------------------------- maternal
class PregnancyBase(BaseModel):
    patient_id: str
    gravida: int = 1
    para: int = 0
    expected_due_date: str = ""
    last_menstrual_period: str = ""
    risk_type: str = "Normal"  # Normal | High Risk
    notes: str = ""


class PregnancyCreate(PregnancyBase):
    pass


class PregnancyUpdate(BaseModel):
    gravida: Optional[int] = None
    para: Optional[int] = None
    expected_due_date: Optional[str] = None
    last_menstrual_period: Optional[str] = None
    risk_type: Optional[str] = None
    notes: Optional[str] = None


class Pregnancy(PregnancyBase):
    id: str = Field(default_factory=_uid)
    created_at: datetime = Field(default_factory=_now)
    patient_name: str = ""
    patient_code: str = ""
    patient_age: int = 0
    blood_type: str = ""


class PrenatalVisitCreate(BaseModel):
    pregnancy_id: str
    visit_date: str
    pregnancy_week: int = 0
    notes: str = ""


class PrenatalVisit(PrenatalVisitCreate):
    id: str = Field(default_factory=_uid)
    health_worker: str = ""


# ---------------------------------------------------------------- pediatric
class ChildBase(BaseModel):
    patient_id: str
    mother_name: str = ""
    birth_weight: float = 0.0
    current_weight: float = 0.0


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    mother_name: Optional[str] = None
    birth_weight: Optional[float] = None
    current_weight: Optional[float] = None


class Child(ChildBase):
    id: str = Field(default_factory=_uid)
    created_at: datetime = Field(default_factory=_now)
    patient_name: str = ""
    patient_code: str = ""
    birth_date: str = ""
    patient_age: int = 0
    sex: str = ""
    blood_type: str = ""


class ImmunizationCreate(BaseModel):
    child_id: str
    vaccine_name: str
    date_given: str


class Immunization(ImmunizationCreate):
    id: str = Field(default_factory=_uid)
    administered_by: str = ""


# ---------------------------------------------------------------- health records
class HealthRecordBase(BaseModel):
    patient_id: str
    consultation_date: str
    consultation_type: str = "General Consultation"
    chief_complaint: str = ""
    diagnosis: str = ""
    treatment: str = ""
    notes: str = ""


class HealthRecordCreate(HealthRecordBase):
    pass


class HealthRecordUpdate(BaseModel):
    consultation_date: Optional[str] = None
    consultation_type: Optional[str] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None


class HealthRecord(HealthRecordBase):
    id: str = Field(default_factory=_uid)
    record_id: str
    health_worker: str = ""
    patient_name: str = ""
    patient_code: str = ""
    created_at: datetime = Field(default_factory=_now)


class HealthRecordPage(BaseModel):
    items: List[HealthRecord]
    total: int
    page: int
    pages: int


# ---------------------------------------------------------------- analytics
class NamedValue(BaseModel):
    name: str
    value: int


class DashboardStats(BaseModel):
    total_patients: int
    total_pregnant: int
    total_children: int
    todays_consultations: int
    by_age_group: List[NamedValue]
    consultations_this_month: List[NamedValue]
    recent_consultations: List[HealthRecord]


class ReportSummary(BaseModel):
    total_patients: int
    total_pregnant: int
    total_children: int
    total_consultations: int
    by_type: List[NamedValue]
    by_consultation_type: List[NamedValue]
    range_start: str
    range_end: str


class OkResponse(BaseModel):
    ok: bool = True
