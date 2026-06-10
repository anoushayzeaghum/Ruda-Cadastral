"""
ASGI config for server project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

# PROJ_DATA must be set before Django/GDAL is imported.
os.environ.setdefault("PROJ_DATA", r"C:\Program Files\QGIS 3.44.11\share\proj")
os.environ.setdefault("PROJ_LIB",  r"C:\Program Files\QGIS 3.44.11\share\proj")

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings.local")

application = get_asgi_application()
