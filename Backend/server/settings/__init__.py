# Settings package; use server.settings.local or server.settings.production
try:
    from .local import *
except Exception:
    from .base import *