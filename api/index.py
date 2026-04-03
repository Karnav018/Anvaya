import os
import sys

# Add the backend directory and root to the search path for Vercel
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, 'backend'))
sys.path.append(base_dir)

from app.main import app
