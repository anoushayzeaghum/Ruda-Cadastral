from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from ..models import Murabba


murabba_mapping = {
    # replace after checking fields
    "district": "DISTRICT",
    "dist_id": "DIST_ID",
    "tehsil": "TEHSIL",
    "tehsil_id": "TEHSIL_ID",
    "kc": "KC",
    "kc_id": "KC_ID",
    "pc": "PC",
    "pc_id": "PC_ID",
    "mauza": "MAUZA",
    "mauza_id": "MAUZA_ID",
    "murabba_no": "M",
    "sheets": "SHEETS",
    "geom": "MULTIPOLYGON",
}


def run_murabba_import(shp_path):

    ds = DataSource(shp_path)
    layer = ds[0]

    print("📌 MURABBA FIELDS:", layer.fields)

    feature = layer[0]

    print("📌 FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    lm = LayerMapping(
        Murabba,
        shp_path,
        murabba_mapping,
        transform=True,
        encoding="utf-8",
    )

    lm.save(strict=True, verbose=True)

    print("✅ MURABBA IMPORT COMPLETED")
    print("TOTAL MURABBAS:", Murabba.objects.count())