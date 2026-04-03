from fastapi import APIRouter
from app.database import get_pool
import asyncpg

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/db-test")
async def test_database():
    """Test database connection and table existence"""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Test basic connection
            result = await conn.fetchval("SELECT 1")
            
            # Check if users table exists
            table_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """)
            
            # Check extensions
            extensions = await conn.fetch("SELECT extname FROM pg_extension")
            
            return {
                "status": "success",
                "connection_test": result,
                "users_table_exists": table_exists,
                "extensions": [ext["extname"] for ext in extensions],
                "database_url_host": "hidden_for_security"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }