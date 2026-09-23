from ...models import SWLine
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "objectid": ("objectid", "oid"),
    "name": ("name", "line_name"),
    "dia": ("dia", "diameter"),
    "shape_leng": ("shape_leng", "shape_length", "length"),
    "project_id": ("project_id", "project_gid", "project"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        SWLine,
        shp_path,
        FIELD_ALIASES,
        "MULTILINESTRING",
    )
    print("TOTAL OBJECTS IN DB:", SWLine.objects.count())