import re

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.utils import LayerMapping
from django.db import transaction

from ..models import Khasra


# Khasra shapefiles are not always exported with exactly the same DBF field
# names. The old importer required every field below to exist and therefore
# crashed as soon as one optional field (for example JOIN_SHP) was missing.
#
# These aliases let us map the fields that actually exist in the uploaded
# shapefile while leaving genuinely missing optional model fields as NULL.
KHASRA_FIELD_ALIASES = {
    "join_shp": ("JOIN_SHP", "JOINSHP", "JOIN"),
    "district": ("DISTRICT", "DISTRICT_N", "DIST_NAME"),
    "dist_id": ("DIST_ID", "DISTID", "DISTRICT_I"),
    "tehsil": ("TEHSIL", "TEHSIL_N", "TEH_NAME"),
    "tehsil_id": ("TEHSIL_ID", "TEHSILID", "TEH_ID"),
    "kc": ("KC",),
    "kc_id": ("KC_ID", "KCID"),
    "pc": ("PC",),
    "pc_id": ("PC_ID", "PCID"),
    "mauza": ("MAUZA", "MOUZA", "MOZA"),
    "mauza_id": ("MAUZA_ID", "MOUZA_ID", "MOZA_ID", "MAUZAID"),
    "hadbust_no": ("HADBUST_NO", "HADBUSTNO", "HADBUST"),
    "asse_cir": ("ASSE_CIR", "ASSECIR", "ASSESS_CIR"),
    "karam": ("KARAM",),
    "type": ("TYPE",),
    "sq": ("SQ", "SQUARE"),
    "kh": ("KH", "K", "KHASRA", "KHASRA_NO", "KH_NO"),
    "sk": ("SK", "SUB_KHASRA", "SUBKHASRA", "SUB_KH"),
    "khasra_id": ("KHASRA_ID", "KHASRAID", "KH_ID"),
    "khewat_id": ("KHEWAT_ID", "KHEWATID"),
    "khatoni_no": ("KHATONI_NO", "KHATONINO", "KHATONI"),
    "dc_rate": ("DC_RATE", "DCRATE"),
    "remarks": ("REMARKS", "REMARK"),
    "b": ("B",),
}


def _normalize_field_name(value):
    """Compare DBF field names case/underscore/punctuation-insensitively."""
    return re.sub(r"[^A-Z0-9]", "", str(value).upper())


def build_khasra_mapping(layer):
    """
    Build a LayerMapping dictionary from the fields that actually exist.

    Geometry is always mapped to the Khasra MultiPolygonField. Missing
    attribute fields are deliberately omitted so nullable model columns are
    saved as NULL instead of causing LayerMapError.
    """
    available_fields = list(layer.fields)

    normalized_lookup = {}
    for ogr_field in available_fields:
        normalized_lookup.setdefault(_normalize_field_name(ogr_field), ogr_field)

    mapping = {"geom": "MULTIPOLYGON"}
    used_fields = {}
    skipped_fields = []

    for model_field, aliases in KHASRA_FIELD_ALIASES.items():
        matched_ogr_field = None

        for alias in aliases:
            matched_ogr_field = normalized_lookup.get(
                _normalize_field_name(alias)
            )
            if matched_ogr_field:
                break

        if matched_ogr_field:
            mapping[model_field] = matched_ogr_field
            used_fields[model_field] = matched_ogr_field
        else:
            skipped_fields.append(model_field)

    return mapping, used_fields, skipped_fields


def run_khasra_import(shp_path):
    ds = DataSource(shp_path)
    layer = ds[0]

    if layer.num_feat == 0:
        raise ValueError("The uploaded Khasra shapefile contains no features.")

    print("📌 KHASRA FIELDS:", list(layer.fields))

    mapping, used_fields, skipped_fields = build_khasra_mapping(layer)

    print("📌 KHASRA MAPPING USED:", used_fields)
    if skipped_fields:
        print(
            "ℹ️ KHASRA OPTIONAL FIELDS NOT PRESENT (will remain NULL):",
            skipped_fields,
        )

    # A Khasra import should contain at least one usable Khasra identifier.
    # Do not require JOIN_SHP specifically because it is optional in the DB
    # model and is exactly what caused the current 500 error.
    if not {"kh", "khasra_id", "join_shp"}.intersection(used_fields):
        raise ValueError(
            "No Khasra identifier field was found in the shapefile. "
            "Expected at least one of: KH, KHASRA/KHASRA_NO, "
            "KHASRA_ID, or JOIN_SHP."
        )

    feature = layer[0]
    print("📌 FIRST FEATURE:")
    for field in layer.fields:
        print(field, "=", feature[field])

    before_count = Khasra.objects.count()

    lm = LayerMapping(
        Khasra,
        shp_path,
        mapping,
        transform=True,
        encoding="utf-8",
    )

    # Keep the import append-only, like the existing Mauza import, but make
    # the whole upload atomic so a bad feature cannot leave a partial import.
    with transaction.atomic():
        lm.save(strict=True, verbose=True)

    after_count = Khasra.objects.count()
    imported_count = max(after_count - before_count, 0)

    print("✅ KHASRA IMPORT COMPLETED")
    print("IMPORTED KHASRAS:", imported_count)
    print("TOTAL KHASRAS:", after_count)

    return {
        "imported": imported_count,
        "total": after_count,
        "mapped_fields": used_fields,
        "skipped_optional_fields": skipped_fields,
    }
