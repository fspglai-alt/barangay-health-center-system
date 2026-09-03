from calendar import monthrange
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from lib.auth import calc_age, current_user
from lib.dates import today_iso
from lib.db import db
from models.schemas import DashboardStats, NamedValue, ReportSummary
from routers.records import to_record

router = APIRouter(tags=["analytics"])

AGE_BUCKETS = [("0-5 years", 0, 5), ("6-18 years", 6, 18), ("19-59 years", 19, 59), ("60+ years", 60, 200)]
CONSULT_TYPES = ["General Consultation", "Prenatal Check-up", "Follow-up Check-up", "Immunization"]


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(_u: dict = Depends(current_user)):
    patients = await db.patients.find().to_list(5000)
    ages = [calc_age(p.get("birth_date", "")) for p in patients]
    by_age = [NamedValue(name=n, value=sum(1 for a in ages if lo <= a <= hi)) for n, lo, hi in AGE_BUCKETS]

    today = today_iso()
    now = datetime.now(timezone.utc)
    prefix = now.strftime("%Y-%m")
    month_records = await db.health_records.find({"consultation_date": {"$regex": f"^{prefix}"}}).to_list(5000)
    days = monthrange(now.year, now.month)[1]
    per_day = [
        NamedValue(name=str(d), value=sum(1 for r in month_records if r.get("consultation_date", "")[8:10] == f"{d:02d}"))
        for d in range(1, days + 1)
    ]

    recent = await db.health_records.find().sort("consultation_date", -1).to_list(6)
    return DashboardStats(
        total_patients=len(patients),
        total_pregnant=await db.pregnancies.count_documents({}),
        total_children=await db.children.count_documents({}),
        todays_consultations=await db.health_records.count_documents({"consultation_date": {"$regex": f"^{today}"}}),
        by_age_group=by_age,
        consultations_this_month=per_day,
        recent_consultations=[to_record(r) for r in recent],
    )


@router.get("/reports", response_model=ReportSummary)
async def reports(start: str = "", end: str = "", _u: dict = Depends(current_user)):
    now = datetime.now(timezone.utc)
    if not start:
        start = now.strftime("%Y-%m-01")
    if not end:
        end = now.strftime(f"%Y-%m-{monthrange(now.year, now.month)[1]:02d}")

    patients = await db.patients.find().to_list(5000)
    records = await db.health_records.find(
        {"consultation_date": {"$gte": start, "$lte": end + "T23:59:59"}}
    ).to_list(5000)

    seniors = sum(1 for p in patients if calc_age(p.get("birth_date", "")) >= 60)
    n_preg = await db.pregnancies.count_documents({})
    n_child = await db.children.count_documents({})

    by_type = [
        NamedValue(name="Patients", value=len(patients)),
        NamedValue(name="Pregnant Women", value=n_preg),
        NamedValue(name="Babies / Children", value=n_child),
        NamedValue(name="Senior Citizens", value=seniors),
    ]
    by_ct = [
        NamedValue(name=t, value=sum(1 for r in records if r.get("consultation_type") == t))
        for t in CONSULT_TYPES
    ]
    return ReportSummary(
        total_patients=len(patients),
        total_pregnant=n_preg,
        total_children=n_child,
        total_consultations=len(records),
        by_type=by_type,
        by_consultation_type=by_ct,
        range_start=start,
        range_end=end,
    )
