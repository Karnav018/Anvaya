import os
import sys
import json
import traceback

try:
    # Add the root directory to path first
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.append(base_dir)
    sys.path.append(os.path.join(base_dir, 'backend'))

    # Import the actual FastAPI app
    from backend.app.main import app as fastapi_app
    app = fastapi_app # For Vercel's discovery

except Exception as e:
    # If the app fails to even load (import error, config crash), 
    # we catch it and return a mock function that reports the error.
    error_msg = traceback.format_exc()
    print(f"CRITICAL STARTUP ERROR:\n{error_msg}")

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    async def catch_all(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Startup Failure",
                "message": str(e),
                "traceback": error_msg,
                "hint": "Check if database/secret env vars are set in Vercel Dashboard."
            }
        )
