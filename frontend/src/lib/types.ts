// Hand-written mirrors of backend/models/schemas.py — keep in sync on every model change.

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  birth_date: string;
  age: number;
  sex: string;
  civil_status: string;
  contact_number: string;
  address: string;
  blood_type: string;
  occupation: string;
  philhealth_number: string;
  patient_type: string;
  registered_by: string;
  created_at: string;
}

export interface PatientPage {
  items: Patient[];
  total: number;
  page: number;
  pages: number;
}

export interface Pregnancy {
  id: string;
  patient_id: string;
  gravida: number;
  para: number;
  expected_due_date: string;
  last_menstrual_period: string;
  risk_type: string;
  notes: string;
  created_at: string;
  patient_name: string;
  patient_code: string;
  patient_age: number;
  blood_type: string;
}

export interface PrenatalVisit {
  id: string;
  pregnancy_id: string;
  visit_date: string;
  pregnancy_week: number;
  notes: string;
  health_worker: string;
}

export interface Child {
  id: string;
  patient_id: string;
  mother_name: string;
  birth_weight: number;
  current_weight: number;
  created_at: string;
  patient_name: string;
  patient_code: string;
  birth_date: string;
  patient_age: number;
  sex: string;
  blood_type: string;
}

export interface Immunization {
  id: string;
  child_id: string;
  vaccine_name: string;
  date_given: string;
  administered_by: string;
}

export interface HealthRecord {
  id: string;
  record_id: string;
  patient_id: string;
  consultation_date: string;
  consultation_type: string;
  chief_complaint: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  health_worker: string;
  patient_name: string;
  patient_code: string;
  created_at: string;
}

export interface HealthRecordPage {
  items: HealthRecord[];
  total: number;
  page: number;
  pages: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface DashboardStats {
  total_patients: number;
  total_pregnant: number;
  total_children: number;
  todays_consultations: number;
  by_age_group: NamedValue[];
  consultations_this_month: NamedValue[];
  recent_consultations: HealthRecord[];
}

export interface ReportSummary {
  total_patients: number;
  total_pregnant: number;
  total_children: number;
  total_consultations: number;
  by_type: NamedValue[];
  by_consultation_type: NamedValue[];
  range_start: string;
  range_end: string;
}

export interface OkResponse {
  ok: boolean;
}

export interface MessageResponse {
  message: string;
}

export const CONSULTATION_TYPES = [
  "General Consultation",
  "Prenatal Check-up",
  "Follow-up Check-up",
  "Immunization",
];

export const PATIENT_TYPE_LABELS: Record<string, string> = {
  general: "General",
  maternal: "Pregnant Woman",
  pediatric: "Baby / Child",
  senior: "Senior Citizen",
};

export const VACCINE_OPTIONS = [
  "BCG",
  "Hepatitis B",
  "Pentavalent 1",
  "Pentavalent 2",
  "Pentavalent 3",
  "PCV 1",
  "PCV 2",
  "PCV 3",
  "OPV 1",
  "OPV 2",
  "OPV 3",
  "MMR",
];
