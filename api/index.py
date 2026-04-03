import os
import sys

# Add the backend directory to the search path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.main import app
