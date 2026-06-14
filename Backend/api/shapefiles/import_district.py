from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource
from ..models import District


district_mapping = {
    "objectid": "OBJECTID",
    "id": "ID",
    "name": "NAME",
    "extent": "EXTENT",
    "shape_star": "Shape_STAr",
    "shape_stle": "Shape_STLe",
    "geom": "MULTIPOLYGON",
}


def run_shapefile_import(shp_path):

    ds = DataSource(shp_path)
    layer = ds[0]

    print("FIELDS:", layer.fields)

    # ✅ STEP 1: validate required shapefile fields
    required_fields = [
        "OBJECTID",
        "ID",
        "NAME",
        "EXTENT",
        "Shape_STAr",
        "Shape_STLe",
    ]

    shp_fields = set(layer.fields)

    missing = [f for f in required_fields if f not in shp_fields]

    if missing:
        raise Exception(
            f"Missing fields in shapefile: {', '.join(missing)}"
        )

    # optional debug
    feature = layer[0]
    print("FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    # ✅ STEP 2: import using LayerMapping
    lm = LayerMapping(
        District,
        shp_path,
        district_mapping,
        transform=True,
        encoding="utf-8",
    )

    lm.save(strict=True, verbose=True)

    print("✅ IMPORT COMPLETED")
    print("TOTAL OBJECTS IN DB:", District.objects.count())