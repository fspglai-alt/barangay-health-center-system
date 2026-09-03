from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import (SESSION_COOKIE, current_user, hash_password, new_token,
                      verify_password)
from lib.db import db
from models.schemas import (LoginRequest, MessageResponse, OkResponse,
                            RegisterRequest, User)

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(u: dict) -> User:
    return User(**{k: u[k] for k in ("id", "full_name", "username", "role", "status", "created_at")})


@router.post("/login", response_model=User)
async def login(payload: LoginRequest, response: Response):
    user = await db.users.find_one({"username": payload.username.strip().lower()})
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.get("status") != "active":
        raise HTTPException(
            status_code=403,
            detail="This account is inactive or still pending Administrator approval. "
                   "Please contact your health center Administrator.",
        )
    token = new_token()
    await db.sessions.insert_one({"token": token, "user_id": user["id"]})
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax", path="/", max_age=60 * 60 * 12)
    return _public(user)


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(payload: RegisterRequest):
    """Public self-registration. Always creates an INACTIVE health_worker account —
    an Administrator must activate it before the account can sign in."""
    full_name = payload.full_name.strip()
    username = payload.username.strip().lower()

    if len(full_name) < 3:
        raise HTTPException(status_code=422, detail="Please enter your full name.")
    if len(username) < 3:
        raise HTTPException(status_code=422, detail="Username must be at least 3 characters.")
    if not username.replace("_", "").replace(".", "").isalnum():
        raise HTTPException(
            status_code=422,
            detail="Username may only contain letters, numbers, dots and underscores.",
        )
    if len(payload.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters.")
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=409, detail="That username is already taken.")

    obj = User(full_name=full_name, username=username, role="health_worker", status="inactive")
    doc = obj.model_dump()
    doc["password"] = hash_password(payload.password)
    await db.users.insert_one(doc)
    return MessageResponse(
        message="Your health worker account has been created and is pending Administrator "
                "approval. You will be able to sign in once it is activated."
    )


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
