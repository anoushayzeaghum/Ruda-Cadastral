import os
os.environ["PROJ_DATA"] = r"C:\Program Files\QGIS 3.44.11\share\proj"
os.environ["PROJ_LIB"] = r"C:\Program Files\QGIS 3.44.11\share\proj"
os.environ["DJANGO_SETTINGS_MODULE"] = "server.settings.local"

import django; django.setup()

from gis_analysis.services import (
    run_buffer_analysis,
    run_proximity_analysis,
    run_nearest_facility_analysis,
    run_suitability_analysis,
)
from api.models import Khasra

# Find a khasra inside the RUDA area (near 74.3-74.5, 31.4-31.7)
k = Khasra.objects.first()
print(f"Testing with Khasra gid={k.gid}, mouza={k.mouza}")
centroid = k.geom.centroid
print(f"Centroid: {centroid.coords}")

print("\n--- Buffer ---")
try:
    r = run_buffer_analysis(k.gid, "khasra", 1.0)
    print(f"  OK - counts: {r['counts']}, amenities: {len(r['amenities']['features'])}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n--- Proximity ---")
try:
    r = run_proximity_analysis(k.gid, "khasra", 10)
    print(f"  OK - {len(r['results'])} results")
    for item in r['results'][:3]:
        print(f"    {item['category']}: {item['name']} @ {item['distance_km']} km")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n--- Nearest ---")
try:
    r = run_nearest_facility_analysis(k.gid, "khasra")
    for cat, info in r['nearest'].items():
        if info:
            print(f"  {cat}: {info['name']} @ {info['distance_km']} km")
        else:
            print(f"  {cat}: None found")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n--- Suitability ---")
try:
    weights = {"hospital": 0.25, "school": 0.25, "park": 0.25, "transport": 0.25}
    r = run_suitability_analysis(k.gid, "khasra", weights)
    sr = r['selected_result']
    print(f"  OK - score={sr['score']}, label={sr['label']}")
except Exception as e:
    print(f"  ERROR: {e}")
