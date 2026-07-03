from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "rudametaverse.nespakprogresscenter.com",
    "10.1.10.1",
    "localhost",
    "127.0.0.1", "10.1.12.1"
]

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "ruda_cadastral",
        "USER": "postgres",
        "PASSWORD": "Postgres",
        "HOST": "10.1.10.1",
        "PORT": "5432",
    }
}

CORS_ALLOWED_ORIGINS = [
    "http://rudametaverse.nespakprogresscenter.com",
    "https://rudametaverse.nespakprogresscenter.com",
]

CSRF_TRUSTED_ORIGINS = [
    "http://rudametaverse.nespakprogresscenter.com",
    "https://rudametaverse.nespakprogresscenter.com",
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"