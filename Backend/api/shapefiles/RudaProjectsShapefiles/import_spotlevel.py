from ...models import SpotLevel
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "objectid_1": ("objectid_1", "objectid1"),
    "objectid": ("objectid", "oid"),
    "id": ("id", "point_id"),
    "x": ("x", "easting"),
    "y": ("y", "northing"),
    "z": ("z", "elevation", "elev"),
    "elevation": ("elevation", "elev"),
    "elevatin_i": ("elevatin_i", "elevation_id", "elev_id"),
    "project": ("project_id", "project_gid", "project"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        SpotLevel,
        shp_path,
        FIELD_ALIASES,
        "POINT",
    )
    print("TOTAL OBJECTS IN DB:", SpotLevel.objects.count())