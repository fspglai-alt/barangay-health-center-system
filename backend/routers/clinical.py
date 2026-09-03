from fastapi import APIRouter, Depends, HTTPException

from lib.auth import calc_age, current_user
from lib.db import db
from models.schemas import (Child, ChildCreate, ChildUpdate, Immunization,
                            ImmunizationCreate, OkResponse, Pregnancy,
                            PregnancyCreate, PregnancyUpdate, PrenatalVisit,
                            PrenatalVisitCreate)

router = APIRouter(tags=["clinical"])


async def _patient(pid: str) -> dict:
    doc = await db.patients.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return doc


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ------------------------------------------------------------- pregnancies
async def _hydrate_pregnancy(doc: dict) -> Pregnancy:
    p = await db.patients.find_one({"id": doc["patient_id"]})
    d = _clean(doc)
    if p:
        d["patient_name"] = p["full_name"]
        d["patient_code"] = p["patient_id"]
        d["patient_age"] = calc_age(p.get("birth_date", ""))
        d["blood_type"] = p.get("blood_type", "")
    return Pregnancy(**d)


@router.get("/pregnancies", response_model=list[Pregnancy])
async def list_pregnancies(search: str = "", risk_type: str = "all", _u: dict = Depends(current_user)):
    docs = await db.pregnancies.find().sort("created_at", -1).to_list(500)
    out = [await _hydrate_pregnancy(d) for d in docs]
    if risk_type != "all":
        out = [p for p in out if p.risk_type == risk_type]
    if search.strip():
        s = search.strip().lower()
        out = [p for p in out if s in p.patient_name.lower() or s in p.patient_code.lower()]
    return out


@router.post("/pregnancies", response_model=Pregnancy, status_code=201)
async def create_pregnancy(payload: PregnancyCreate, _u: dict = Depends(current_user)):
    await _patient(payload.patient_id)
    obj = Pregnancy(**payload.model_dump())
    await db.pregnancies.insert_one(obj.model_dump(exclude={"patient_name", "patient_code", "patient_age", "blood_type"}))
    return await _hydrate_pregnancy(await db.pregnancies.find_one({"id": obj.id}) or {})


@router.get("/pregnancies/{gid}", response_model=Pregnancy)
async def get_pregnancy(gid: str, _u: dict = Depends(current_user)):
    doc = await db.pregnancies.find_one({"id": gid})
    if not doc:
        raise HTTPException(status_code=404, detail="Pregnancy record not found")
    return await _hydrate_pregnancy(doc)


@router.put("/pregnancies/{gid}", response_model=Pregnancy)
async def update_pregnancy(gid: str, payload: PregnancyUpdate, _u: dict = Depends(current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        res = await db.pregnancies.update_one({"id": gid}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pregnancy record not found")
    doc = await db.pregnancies.find_one({"id": gid})
    if not doc:
        raise HTTPException(status_code=404, detail="Pregnancy record not found")
    return await _hydrate_pregnancy(doc)


@router.delete("/pregnancies/{gid}", response_model=OkResponse)
async def delete_pregnancy(gid: str, _u: dict = Depends(current_user)):
    res = await db.pregnancies.delete_one({"id": gid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pregnancy record not found")
    await db.prenatal_visits.delete_many({"pregnancy_id": gid})
    return OkResponse()


@router.get("/pregnancies/{gid}/visits", response_model=list[PrenatalVisit])
async def list_visits(gid: str, _u: dict = Depends(current_user)):
    docs = await db.prenatal_visits.find({"pregnancy_id": gid}).sort("visit_date", -1).to_list(200)
    return [PrenatalVisit(**_clean(d)) for d in docs]


@router.post("/prenatal-visits", response_model=PrenatalVisit, status_code=201)
async def create_visit(payload: PrenatalVisitCreate, user: dict = Depends(current_user)):
    if not await db.pregnancies.find_one({"id": payload.pregnancy_id}):
        raise HTTPException(status_code=404, detail="Pregnancy record not found")
    obj = PrenatalVisit(**payload.model_dump(), health_worker=user["full_name"])
    await db.prenatal_visits.insert_one(obj.model_dump())
    return obj


# ------------------------------------------------------------- children
async def _hydrate_child(doc: dict) -> Child:
    p = await db.patients.find_one({"id": doc["patient_id"]})
    d = _clean(doc)
    if p:
        d["patient_name"] = p["full_name"]
        d["patient_code"] = p["patient_id"]
        d["birth_date"] = p.get("birth_date", "")
        d["patient_age"] = calc_age(p.get("birth_date", ""))
        d["sex"] = p.get("sex", "")
        d["blood_type"] = p.get("blood_type", "")
    return Child(**d)


@router.get("/children", response_model=list[Child])
async def list_children(search: str = "", _u: dict = Depends(current_user)):
    docs = await db.children.find().sort("created_at", -1).to_list(500)
    out = [await _hydrate_child(d) for d in docs]
    if search.strip():
        s = search.strip().lower()
        out = [c for c in out if s in c.patient_name.lower() or s in c.patient_code.lower()]
    return out


@router.post("/children", response_model=Child, status_code=201)
async def create_child(payload: ChildCreate, _u: dict = Depends(current_user)):
    await _patient(payload.patient_id)
    obj = Child(**payload.model_dump())
    await db.children.insert_one(
        obj.model_dump(exclude={"patient_name", "patient_code", "birth_date", "patient_age", "sex", "blood_type"})
    )
    return await _hydrate_child(await db.children.find_one({"id": obj.id}) or {})


@router.get("/children/{cid}", response_model=Child)
async def get_child(cid: str, _u: dict = Depends(current_user)):
    doc = await db.children.find_one({"id": cid})
    if not doc:
        raise HTTPException(status_code=404, detail="Child record not found")
    return await _hydrate_child(doc)


@router.put("/children/{cid}", response_model=Child)
async def update_child(cid: str, payload: ChildUpdate, _u: dict = Depends(current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        res = await db.children.update_one({"id": cid}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Child record not found")
    doc = await db.children.find_one({"id": cid})
    if not doc:
        raise HTTPException(status_code=404, detail="Child record not found")
    return await _hydrate_child(doc)


@router.delete("/children/{cid}", response_model=OkResponse)
async def delete_child(cid: str, _u: dict = Depends(current_user)):
    res = await db.children.delete_one({"id": cid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child record not found")
    await db.immunizations.delete_many({"child_id": cid})
    return OkResponse()


@router.get("/children/{cid}/immunizations", response_model=list[Immunization])
async def list_immunizations(cid: str, _u: dict = Depends(current_user)):
    docs = await db.immunizations.find({"child_id": cid}).sort("date_given", -1).to_list(200)
    return [Immunization(**_clean(d)) for d in docs]


@router.post("/immunizations", response_model=Immunization, status_code=201)
async def create_immunization(payload: ImmunizationCreate, user: dict = Depends(current_user)):
    if not await db.children.find_one({"id": payload.child_id}):
        raise HTTPException(status_code=404, detail="Child record not found")
    obj = Immunization(**payload.model_dump(), administered_by=user["full_name"])
    await db.immunizations.insert_one(obj.model_dump())
    return obj


@router.delete("/immunizations/{iid}", response_model=OkResponse)
async def delete_immunization(iid: str, _u: dict = Depends(current_user)):
    res = await db.immunizations.delete_one({"id": iid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Immunization record not found")
    return OkResponse()
