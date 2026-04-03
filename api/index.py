import os
import sys

# Add the backend directory and root to the search path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, 'backend'))
sys.path.append(base_dir)

# Import the actual FastAPI app - Vercel looks for 'app' at the top level
from app.main import app
