from .base import *

DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": get_secret("DB_NAME", "ruda_cadastral"),
        "USER": get_secret("DB_USER", "postgres"),
        "PASSWORD": get_secret("DB_PASSWORD", "admin123"),
        "HOST": "localhost",
        "PORT": "5432",
    }
}

GDAL_LIBRARY_PATH = secrets["GDAL_LIBRARY_PATH"]
GEOS_LIBRARY_PATH = secrets["GEOS_LIBRARY_PATH"]