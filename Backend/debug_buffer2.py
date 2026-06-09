import os

# MUST be set before Django/GDAL is imported — same as manage.py fix
os.environ["PROJ_DATA"] = r"C:\Program Files\QGIS 3.44.11\share\proj"
os.environ["PROJ_LIB"] = r"C:\Program Files\QGIS 3.44.11\share\proj"
os.environ["DJANGO_SETTINGS_MODULE"] = "server.settings.local"

import django
django.setup()

from gis_analysis.services import run_buffer_analysis

try:
    result = run_buffer_analysis(parcel_id=1, parcel_type="khasra", radius_km=1.0)
    print("Buffer SUCCESS")
    print("  Counts:", result.get("counts"))
    print("  Buffer polygon type:", result.get("buffer", {}).get("type"))
    print("  Amenities in buffer:", len(result.get("amenities", {}).get("features", [])))
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback; traceback.print_exc()
