"""Import an Acre shapefile into the existing ``acre`` table."""

import re
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPoint, MultiPolygon
from django.db import transaction


class ShapefileImportError(Exception):
    """Raised when the shapefile cannot be safely imported."""


def _normalise_name(value):
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def _field_lookup(layer):
    return {_normalise_name(name): name for name in layer.fields}


def _field_value(feature, lookup, *aliases):
    for alias in aliases:
        actual = lookup.get(_normalise_name(alias))
        if not actual:
            continue
        field = feature[actual]
        value = getattr(field, "value", field)
        if callable(value):
            value = value()
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value if value else None
        return value
    return None


def _as_int(value, field_name):
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError) as exc:
        raise ShapefileImportError(
            f"Invalid integer value for {field_name}: {value!r}"
        ) from exc


def _as_float(value, field_name):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ShapefileImportError(
            f"Invalid numeric value for {field_name}: {value!r}"
        ) from exc


def _as_text(value, max_length=None, field_name="field"):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    if max_length and len(value) > max_length:
        raise ShapefileImportError(
            f"{field_name} exceeds maximum length {max_length}: {value!r}"
        )
    return value


def _geometry(feature, layer, expected):
    ogr_geom = feature.geom
    if ogr_geom is None:
        raise ShapefileImportError(f"Feature {feature.fid} has no geometry.")

    try:
        source_srs = ogr_geom.srs or layer.srs
        source_srid = getattr(source_srs, "srid", None) if source_srs else None
        if ogr_geom.srs is None and source_srs is not None:
            ogr_geom.srs = source_srs
        if source_srs and source_srid != 4326:
            ogr_geom.transform(4326)
    except Exception as exc:
        raise ShapefileImportError(
            f"Could not transform feature {feature.fid} to EPSG:4326: {exc}"
        ) from exc

    geos = ogr_geom.geos
    geos.srid = 4326
    geom_type = str(getattr(geos, "geom_type", ""))

    if expected == "multipolygon":
        if geom_type == "Polygon":
            geos = MultiPolygon(geos, srid=4326)
        elif geom_type != "MultiPolygon":
            raise ShapefileImportError(
                f"Feature {feature.fid} has {geom_type}; Polygon/MultiPolygon is required."
            )

    if expected == "multipoint":
        if geom_type == "Point":
            geos = MultiPoint(geos, srid=4326)
        elif geom_type != "MultiPoint":
            raise ShapefileImportError(
                f"Feature {feature.fid} has {geom_type}; Point/MultiPoint is required."
            )

    return geos


def _validate_fk(rows, row_key, model, lookup_field, label):
    requested = {row[row_key] for row in rows if row.get(row_key) is not None}
    if not requested:
        return
    found = set(
        model.objects.filter(**{f"{lookup_field}__in": requested})
        .values_list(lookup_field, flat=True)
    )
    missing = requested - found
    if missing:
        shown = ", ".join(str(v) for v in sorted(missing, key=str)[:20])
        suffix = " ..." if len(missing) > 20 else ""
        raise ShapefileImportError(
            f"{label} reference(s) not found in database: {shown}{suffix}"
        )


def _validate_integer_pk(model, rows):
    gids = [row.get("gid") for row in rows]
    if any(gid is None for gid in gids):
        raise ShapefileImportError(
            f"{model.__name__} requires a GID/gid field in the shapefile."
        )

    duplicate_gids = sorted({gid for gid in gids if gids.count(gid) > 1})
    if duplicate_gids:
        shown = ", ".join(map(str, duplicate_gids[:20]))
        raise ShapefileImportError(f"Duplicate gid value(s) in shapefile: {shown}")

    existing = list(model.objects.filter(gid__in=gids).values_list("gid", flat=True)[:20])
    if existing:
        shown = ", ".join(map(str, existing))
        raise ShapefileImportError(
            f"Import stopped because gid value(s) already exist in "
            f"{model._meta.db_table}: {shown}"
        )

from ..models import Acre, District, Mauza, Tehsil


def run_acre_import(shp_path):
    ds = DataSource(str(shp_path))
    layer = ds[0]
    lookup = _field_lookup(layer)
    rows = []

    for feature in layer:
        rows.append({
            "district_id": _as_int(_field_value(feature, lookup, "dist_id", "district_id"), "dist_id"),
            "tehsil_id": _as_int(_field_value(feature, lookup, "tehsil_id"), "tehsil_id"),
            "mauza_id": _as_float(_field_value(feature, lookup, "mauza_id", "moza_id", "mouza_id"), "mauza_id"),
            "sq": _as_float(_field_value(feature, lookup, "sq", "square", "square_no"), "sq"),
            "acre": _as_float(_field_value(feature, lookup, "acre", "acre_no"), "acre"),
            "layer": _as_text(_field_value(feature, lookup, "layer"), 100, "layer"),
            "geom": _geometry(feature, layer, "multipolygon"),
        })

    if not rows:
        raise ShapefileImportError("The Acre shapefile contains no features.")

    _validate_fk(rows, "district_id", District, "gid", "District")
    _validate_fk(rows, "tehsil_id", Tehsil, "gid", "Tehsil")
    _validate_fk(rows, "mauza_id", Mauza, "mauza_id", "Mauza")

    with transaction.atomic():
        # Acre.gid is an AutoField, so it is intentionally not read from the SHP.
        Acre.objects.bulk_create([Acre(**row) for row in rows], batch_size=1000)

    return len(rows)
