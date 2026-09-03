from datetime import datetime, timezone
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from lib.auth import calc_age, current_user
from lib.db import db
from models.schemas import (OkResponse, Patient, PatientCreate, PatientPage,
                            PatientUpdate)

router = APIRouter(prefix="/patients", tags=["patients"])


async def next_patient_code() -> str:
    year = datetime.now(timezone.utc).year
    count = await db.patients.count_documents({})
    return f"BHC-{year}-{count + 1:04d}"


def to_patient(doc: dict) -> Patient:
    doc = dict(doc)
    doc.pop("_id", None)
    doc["age"] = calc_age(doc.get("birth_date", ""))
    return Patient(**doc)


@router.get("", response_model=PatientPage)
async def list_patients(
    search: str = "",
    age_group: str = "all",
    sex: str = "all",
    patient_type: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=100),
    _user: dict = Depends(current_user),
):
    query: dict = {}
    if search.strip():
        query["$or"] = [
            {"full_name": {"$regex": search.strip(), "$options": "i"}},
            {"patient_id": {"$regex": search.strip(), "$options": "i"}},
            {"philhealth_number": {"$regex": search.strip(), "$options": "i"}},
        ]
    if sex != "all":
        query["sex"] = sex
    if patient_type != "all":
        query["patient_type"] = patient_type

    docs = await db.patients.find(query).sort("created_at", -1).to_list(2000)
    items = [to_patient(d) for d in docs]

    ranges = {"0-5": (0, 5), "6-18": (6, 18), "19-59": (19, 59), "60+": (60, 200)};
    if age_group in ranges:
        lo, hi = ranges[age_group]
        items = [p for p in items if lo <= p.age <= hi]

    total = len(items)
    pages = max(1, ceil(total / page_size))
    start = (page - 1) * page_size
    return PatientPage(items=items[start:start + page_size], total=total, page=page, pages=pages)


@router.post("", response_model=Patient, status_code=201)
async def create_patient(payload: PatientCreate, user: dict = Depends(current_user)):
    if not payload.full_name.strip():
        raise HTTPException(status_code=422, detail="Full name is required")
    obj = Patient(
        **payload.model_dump(),
        patient_id=await next_patient_code(),
        registered_by=user["full_name"],
    )
    obj.age = calc_age(obj.birth_date)
    await db.patients.insert_one(obj.model_dump())
    return obj


@router.get("/{pid}", response_model=Patient)
async def get_patient(pid: str, _user: dict = Depends(current_user)):
    doc = await db.patients.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return to_patient(doc)


@router.put("/{pid}", response_model=Patient)
async def update_patient(pid: str, payload: PatientUpdate, _user: dict = Depends(current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        res = await db.patients.update_one({"id": pid}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
    doc = await db.patients.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return to_patient(doc)


@router.delete("/{pid}", response_model=OkResponse)
async def delete_patient(pid: str, _user: dict = Depends(current_user)):
    res = await db.patients.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.health_records.delete_many({"patient_id": pid})
    await db.pregnancies.delete_many({"patient_id": pid})
    await db.children.delete_many({"patient_id": pid})
    return OkResponse()


@router.get("/{pid}/records", response_model=list)
async def patient_records(pid: str, limit: Optional[int] = None, _user: dict = Depends(current_user)):
    from routers.records import to_record
    docs = await db.health_records.find({"patient_id": pid}).sort("consultation_date", -1).to_list(500)
    out = [to_record(d) for d in docs]
    return out[:limit] if limit else out
