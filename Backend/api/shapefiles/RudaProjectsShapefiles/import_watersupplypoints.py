from ...models import WSPoint
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "type": ("type", "point_type"),
    "name": ("name", "point_name"),
    "project": ("project_id", "project_gid", "project"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        WSPoint,
        shp_path,
        FIELD_ALIASES,
        "POINT",
    )
    print("TOTAL OBJECTS IN DB:", WSPoint.objects.count())