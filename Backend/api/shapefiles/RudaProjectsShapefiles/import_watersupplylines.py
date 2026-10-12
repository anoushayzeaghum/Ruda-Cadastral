from ...models import WSL
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "shape_leng": ("shape_leng", "shape_length", "length"),
    "dia": ("dia", "diameter"),
    "type": ("type", "line_type"),
    "name": ("name", "line_name"),
    "project": ("project_id", "project_gid", "project"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        WSL,
        shp_path,
        FIELD_ALIASES,
        "MULTILINESTRING",
    )
    print("TOTAL OBJECTS IN DB:", WSL.objects.count())