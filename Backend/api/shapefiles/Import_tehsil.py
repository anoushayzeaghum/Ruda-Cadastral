from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from ..models import Tehsil


tehsil_mapping = {
    "objectid": "OBJECTID",
    "id": "ID",
    "name": "NAME",
    "district": "DISTRICT",
    "district_i": "DISTRICT_I",
    "extent": "EXTENT",
    "shape_star": "Shape_STAr",
    "shape_stle": "Shape_STLe",
    "geom": "MULTIPOLYGON",
}


def run_tehsil_import(shp_path):

    # DEBUG (optional but helpful)
    ds = DataSource(shp_path)
    layer = ds[0]

    print("📌 TEHSIL SHAPEFILE FIELDS:", layer.fields)

    feature = layer[0]
    print("📌 FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    lm = LayerMapping(
        Tehsil,
        shp_path,
        tehsil_mapping,
        transform=True,
        encoding="utf-8",
    )

    lm.save(strict=True, verbose=True)

    print("✅ TEHSIL IMPORT COMPLETED")
    print("TOTAL TEHSILS IN DB:", Tehsil.objects.count())