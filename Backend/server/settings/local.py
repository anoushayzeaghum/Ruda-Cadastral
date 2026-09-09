import os

# Allow Windows to resolve GDAL/GEOS transitive DLL dependencies from the QGIS bin directory.
# This must happen before any Django/GeoDjango imports load the native libraries.
_qgis_bin = r"C:\Program Files\QGIS 3.44.13\bin"
if os.path.isdir(_qgis_bin):
    os.add_dll_directory(_qgis_bin)

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
        "PASSWORD": get_secret("DB_PASSWORD", "postgres"),
        "HOST": "localhost",
        "PORT": "5432",
    }
}

GDAL_LIBRARY_PATH = secrets["GDAL_LIBRARY_PATH"]
GEOS_LIBRARY_PATH = secrets["GEOS_LIBRARY_PATH"]