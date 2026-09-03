"""Cookie-session auth helpers."""
from __future__ import annotations

import hashlib
import secrets
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException

from lib.db import db

SESSION_COOKIE = "bhc_session"


def hash_password(raw: str) -> str:
    return hashlib.sha256(("bhc$" + raw).encode()).hexdigest()


def verify_password(raw: str, hashed: str) -> bool:
    return secrets.compare_digest(hash_password(raw), hashed)


def new_token() -> str:
    return secrets.token_urlsafe(32)


def calc_age(birth_date: str) -> int:
    try:
        b = date.fromisoformat(birth_date[:10])
    except ValueError:
        return 0
    t = datetime.now(timezone.utc).date()
    return max(0, t.year - b.year - ((t.month, t.day) < (b.month, b.day)))


async def current_user(bhc_session: Optional[str] = Cookie(default=None)) -> dict:
    if not bhc_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.sessions.find_one({"token": bhc_session})
    if not sess:
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"id": sess["user_id"]})
    if not user or user.get("status") != "active":
        raise HTTPException(status_code=401, detail="Account inactive")
    user.pop("_id", None)
    return user


async def require_admin(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "administrator":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user
