from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_user, hash_password, require_admin
from lib.db import db
from models.schemas import OkResponse, User, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

FIELDS = ("id", "full_name", "username", "role", "status", "created_at")


def _public(u: dict) -> User:
    return User(**{k: u[k] for k in FIELDS})


@router.get("", response_model=list[User])
async def list_users(_u: dict = Depends(current_user)):
    docs = await db.users.find().sort("created_at", 1).to_list(500)
    return [_public(d) for d in docs]


@router.post("", response_model=User, status_code=201)
async def create_user(payload: UserCreate, _a: dict = Depends(require_admin)):
    username = payload.username.strip().lower()
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=409, detail="That username is already taken")
    if len(payload.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    obj = User(**payload.model_dump(exclude={"password"}))
    obj.username = username
    doc = obj.model_dump()
    doc["password"] = hash_password(payload.password)
    await db.users.insert_one(doc)
    return obj


@router.put("/{uid}", response_model=User)
async def update_user(uid: str, payload: UserUpdate, _a: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    pwd = updates.pop("password", None)
    if pwd:
        updates["password"] = hash_password(pwd)
    if "username" in updates:
        updates["username"] = updates["username"].strip().lower()
        other = await db.users.find_one({"username": updates["username"]})
        if other and other["id"] != uid:
            raise HTTPException(status_code=409, detail="That username is already taken")
    if updates:
        res = await db.users.update_one({"id": uid}, {"$set": updates})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    doc = await db.users.find_one({"id": uid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _public(doc)


@router.delete("/{uid}", response_model=OkResponse)
async def delete_user(uid: str, admin: dict = Depends(require_admin)):
    if uid == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    res = await db.users.delete_one({"id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return OkResponse()
