from ...models import Project
from .import_utils import import_model_shapefile

FIELD_ALIASES = {
    "name": ("name", "project_name", "scheme_name"),
    "type": ("type", "project_type"),
    "brief_name": ("brief_name", "brief_nam", "briefname"),
    "phase": ("phase", "project_phase"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        Project,
        shp_path,
        FIELD_ALIASES,
        "MULTIPOLYGON",
        required_fields=("name",),
    )
    print("TOTAL OBJECTS IN DB:", Project.objects.count())