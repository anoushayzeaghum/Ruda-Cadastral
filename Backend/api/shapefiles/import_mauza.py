from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from ..models import Mauza


mauza_mapping = {
    "district": "District",
    "dist_id": "Dist_ID",
    "tehsil": "Tehsil",
    "tehsil_id": "Tehsil_ID",
    "kc": "KC",
    "kc_id": "KC_ID",
    "pc": "PC",
    "pc_id": "PC_ID",
    "mauza": "Mauza",
    "mauza_id": "Mauza_ID",
    "geom": "MULTIPOLYGON",
}


def run_mauza_import(shp_path):

    ds = DataSource(shp_path)
    layer = ds[0]

    print("📌 MAUZA FIELDS:", layer.fields)

    feature = layer[0]

    print("📌 FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    lm = LayerMapping(
        Mauza,
        shp_path,
        mauza_mapping,
        transform=True,
        encoding="utf-8",
    )

    lm.save(strict=True, verbose=True)

    print("✅ MAUZA IMPORT COMPLETED")
    print("TOTAL MAUZAS:", Mauza.objects.count())