from ...models import Block
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "name": ("name", "project_name", "scheme_name"),
    "area": ("area", "area_sqft", "shape_area"),
    "block": ("block", "block_name", "block_no"),
    "project": ("project_id", "project_gid", "project"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        Block,
        shp_path,
        FIELD_ALIASES,
        "MULTIPOLYGON",
    )
    print("TOTAL OBJECTS IN DB:", Block.objects.count())