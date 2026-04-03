from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import SignupRequest, LoginRequest, AuthResponse, UserResponse
from app.core.security import hash_password, verify_password, create_token
from app.core.deps import get_current_user
from app.database import get_pool
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(body: SignupRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if email already exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", body.email
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        hashed = hash_password(body.password)
        user = await conn.fetchrow(
            """
            INSERT INTO users (email, password, name)
            VALUES ($1, $2, $3)
            RETURNING id, email, name, plan,
                      generations_used, generations_limit, generations_reset_at
            """,
            body.email,
            hashed,
            body.name,
        )

    token = create_token({"user_id": str(user["id"]), "email": user["email"]})
    return AuthResponse(token=token, user=UserResponse(**dict(user)))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            """
            SELECT id, email, name, password, plan,
                   generations_used, generations_limit, generations_reset_at
            FROM users WHERE email = $1
            """,
            body.email,
        )

    if user is None or not verify_password(body.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_token({"user_id": str(user["id"]), "email": user["email"]})
    user_dict = {k: v for k, v in dict(user).items() if k != "password"}
    return AuthResponse(token=token, user=UserResponse(**user_dict))


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
