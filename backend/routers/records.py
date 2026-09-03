from datetime import datetime, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query

from lib.auth import calc_age, current_user
from lib.db import db
from models.schemas import (HealthRecord, HealthRecordCreate, HealthRecordPage,
                            HealthRecordUpdate, OkResponse)

router = APIRouter(prefix="/records", tags=["records"])


def to_record(doc: dict) -> HealthRecord:
    doc = dict(doc)
    doc.pop("_id", None)
    return HealthRecord(**doc)


async def next_record_code() -> str:
    year = datetime.now(timezone.utc).year
    count = await db.health_records.count_documents({})
    return f"REC-{year}-{count + 1:04d}"


@router.get("", response_model=HealthRecordPage)
async def list_records(
    search: str = "",
    consultation_type: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=100),
    patient_id: str = "",
    _user: dict = Depends(current_user),
):
    query: dict = {}
    if patient_id:
        query["patient_id"] = patient_id
    if consultation_type != "all":
        query["consultation_type"] = consultation_type
    if search.strip():
        query["$or"] = [
            {"patient_name": {"$regex": search.strip(), "$options": "i"}},
            {"record_id": {"$regex": search.strip(), "$options": "i"}},
            {"chief_complaint": {"$regex": search.strip(), "$options": "i"}},
        ]
    total = await db.health_records.count_documents(query)
    pages = max(1, ceil(total / page_size))
    docs = (
        await db.health_records.find(query)
        .sort("consultation_date", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(page_size)
    )
    return HealthRecordPage(items=[to_record(d) for d in docs], total=total, page=page, pages=pages)


@router.post("", response_model=HealthRecord, status_code=201)
async def create_record(payload: HealthRecordCreate, user: dict = Depends(current_user)):
    patient = await db.patients.find_one({"id": payload.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    obj = HealthRecord(
        **payload.model_dump(),
        record_id=await next_record_code(),
        health_worker=user["full_name"],
        patient_name=patient["full_name"],
        patient_code=patient["patient_id"],
    )
    await db.health_records.insert_one(obj.model_dump())
    return obj


@router.get("/{rid}", response_model=HealthRecord)
async def get_record(rid: str, _user: dict = Depends(current_user)):
    doc = await db.health_records.find_one({"id": rid})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return to_record(doc)


@router.put("/{rid}", response_model=HealthRecord)
async def update_record(rid: str, payload: HealthRecordUpdate, _user: dict = Depends(current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        res = await db.health_records.update_one({"id": rid}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
    doc = await db.health_records.find_one({"id": rid})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return to_record(doc)


@router.delete("/{rid}", response_model=OkResponse)
async def delete_record(rid: str, _user: dict = Depends(current_user)):
    res = await db.health_records.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return OkResponse()


# re-export for patients router
__all__ = ["router", "to_record", "calc_age"]
