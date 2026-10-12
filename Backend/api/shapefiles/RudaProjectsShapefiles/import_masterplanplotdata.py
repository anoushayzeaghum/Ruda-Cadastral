from ...models import Plot
from .import_utils import import_model_shapefile


FIELD_ALIASES = {
    "name": ("name", "project_name", "scheme_name"),
    "type": ("type", "project_type"),
    "remarks": ("remarks", "remark", "comments"),
    "project": ("project_id", "project_gid", "project"),
    "block": ("block_id", "block_gid", "block"),
    "plot_no": ("plot_no", "plot_num", "plot_number"),
    "plot_area": ("plot_area", "area", "area_sqft"),
    "shape_leng": ("shape_leng", "shape_length"),
    "shape_area": ("shape_area",),
    "dimension": ("dimension", "dim"),
    "parkfront": ("parkfront", "park_front"),
    "rd_ft": ("rd_ft", "road_front", "road_frontage"),
    "storey": ("storey", "stories", "storeys"),
    "rd_facing": ("rd_facing", "road_facing"),
    "h": ("h", "height"),
    "demar": ("demar", "demarcation"),
    "possession": ("possession",),
    "poss_st": ("poss_st", "possession_status"),
    "canceled": ("canceled", "cancelled"),
    "site_plan": ("site_plan",),
    "unique_id": ("unique_id", "uid"),
    "tr_srno": ("tr_srno", "transfer_srno"),
    "tr_own": ("tr_own", "transfer_owner"),
    "tr_p_no": ("tr_p_no", "transfer_plot_no"),
    "tr_cate": ("tr_cate", "transfer_category"),
}


def run_shapefile_import(shp_path):

    mapping = import_model_shapefile(
        Plot,
        shp_path,
        FIELD_ALIASES,
        "MULTIPOLYGON",
        required_fields=("plot_no",),
    )
    print("TOTAL OBJECTS IN DB:", Plot.objects.count())