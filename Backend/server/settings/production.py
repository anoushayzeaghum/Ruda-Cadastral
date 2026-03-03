from .base import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS",
    "sdasurvey.cloud,www.sdasurvey.cloud"
).split(",")

# IMPORTANT: origins must NOT contain path or trailing slash
CORS_ALLOWED_ORIGINS = [
    "https://sdasurvey.cloud",
    "https://www.sdasurvey.cloud",
]

# Example: Use DATABASE_URL or env vars later; keeping simple here
# DATABASES = {...}

SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"

