
import os

os.environ["GDAL_LIBRARY_PATH"] = r"C:\Program Files\QGIS 3.44.1\bin\gdal311.dll"
os.environ["GEOS_LIBRARY_PATH"] = r"C:\Program Files\QGIS 3.44.1\bin\geos_c.dll"
os.environ["PATH"] += r";C:\Program Files\QGIS 3.44.1\bin"

# PROJ_DATA must be set before Django/GDAL is imported so coordinate
# transforms (e.g. 4326 → 3857 for buffer polygon) work correctly.
os.environ.setdefault("PROJ_DATA", r"C:\Program Files\QGIS 3.44.11\share\proj")
os.environ.setdefault("PROJ_LIB",  r"C:\Program Files\QGIS 3.44.11\share\proj")
"""
WSGI config for server project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings.local")

application = get_wsgi_application()
