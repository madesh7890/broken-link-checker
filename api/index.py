import os
import sys

# Make the Flask backend importable (config, routes, services ...)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app  # noqa: E402  (Vercel looks for the variable named `app`)
