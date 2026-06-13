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

    # DEBUG
    ds = DataSource(shp_path)
    layer = ds[0]

    print("FIELDS:", layer.fields)

    feature = layer[0]
    print("FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

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