from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from ..models import Khasra


khasra_mapping = {
    # replace after checking fields
    "join_shp": "JOIN_SHP",
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
    "hadbust_no": "HADBUST_NO",
    "asse_cir": "ASSE_CIR",
    "karam": "KARAM",
    "type": "TYPE",
    "sq": "SQ",
    "kh": "KH",
    "sk": "SK",
    "khasra_id": "KHASRA_ID",
    "khewat_id": "KHEWAT_ID",
    "khatoni_no": "KHATONI_NO",
    "dc_rate": "DC_RATE",
    "remarks": "REMARKS",
    "b": "B",
    "geom": "MULTIPOLYGON",
}


def run_khasra_import(shp_path):

    ds = DataSource(shp_path)
    layer = ds[0]

    print("📌 KHASRA FIELDS:", layer.fields)

    feature = layer[0]

    print("📌 FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    lm = LayerMapping(
        Khasra,
        shp_path,
        khasra_mapping,
        transform=True,
        encoding="utf-8",
    )

    lm.save(strict=True, verbose=True)

    print("✅ KHASRA IMPORT COMPLETED")
    print("TOTAL KHASRAS:", Khasra.objects.count())