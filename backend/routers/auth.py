from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import (SESSION_COOKIE, current_user, hash_password, new_token,
                      verify_password)
from lib.db import db
from models.schemas import LoginRequest, OkResponse, User

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(u: dict) -> User:
    return User(**{k: u[k] for k in ("id", "full_name", "username", "role", "status", "created_at")})


@router.post("/login", response_model=User)
async def login(payload: LoginRequest, response: Response):
    user = await db.users.find_one({"username": payload.username.strip().lower()})
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="This account is deactivated")
    token = new_token()
    await db.sessions.insert_one({"token": token, "user_id": user["id"]})
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax", path="/", max_age=60 * 60 * 12)
    return _public(user)


@router.post("/logout", response_model=OkResponse)
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return OkResponse()


@router.get("/me", response_model=User)
async def me(user: dict = Depends(current_user)):
    return _public(user)


@router.post("/seed-admin", response_model=OkResponse)
async def seed_admin():
    """Idempotent bootstrap of the two demo accounts."""
    from models.schemas import User as U
    for full_name, username, role, pwd in [
        ("Dr. Maria Elena Santos", "admin", "administrator", "admin123"),
        ("Rosalinda Dela Cruz, BHW", "healthworker", "health_worker", "worker123"),
    ]:
        if not await db.users.find_one({"username": username}):
            u = U(full_name=full_name, username=username, role=role)
            doc = u.model_dump()
            doc["password"] = hash_password(pwd)
            await db.users.insert_one(doc)
    return OkResponse()
