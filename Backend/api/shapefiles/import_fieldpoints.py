"""Import a FieldPoints point shapefile into the existing ``fieldpoints`` table."""

import gc
import re
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPoint, MultiPolygon
from django.db import connection, transaction
from django.db.models import Max


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

from decimal import Decimal, InvalidOperation


def _as_decimal(value, field_name):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ShapefileImportError(
            f"Invalid decimal value for {field_name}: {value!r}"
        ) from exc

from ..models import FieldPoints, Mauza


def _read_fieldpoint_rows(shp_path):
    """
    Read the shapefile fully, copy attributes/geometry into normal Python/GEOS
    objects, then explicitly release GDAL-backed handles.

    This avoids Windows WinError 32 when the temporary .dbf/.shx files are
    removed immediately after import.
    """
    ds = None
    layer = None
    feature = None

    try:
        ds = DataSource(str(shp_path))
        layer = ds[0]
        lookup = _field_lookup(layer)
        rows = []

        for feature in layer:
            rows.append({
                # gid is intentionally not read from the shapefile.
                "name": _as_text(_field_value(feature, lookup, "name"), 6, "name"),
                "easting": _as_decimal(
                    _field_value(feature, lookup, "easting", "east", "x"),
                    "easting",
                ),
                "northing": _as_decimal(
                    _field_value(feature, lookup, "northing", "north", "y"),
                    "northing",
                ),
                "elevation": _as_text(
                    _field_value(feature, lookup, "elevation", "elev", "z"),
                    254,
                    "elevation",
                ),
                "mauza_id": _as_float(
                    _field_value(feature, lookup, "mauza_id", "moza_id", "mouza_id"),
                    "mauza_id",
                ),
                "layer": _as_text(
                    _field_value(feature, lookup, "layer"),
                    254,
                    "layer",
                ),
                "geom": _geometry(feature, layer, "multipoint"),
            })

        return rows

    finally:
        feature = None
        layer = None
        ds = None
        gc.collect()


def run_fieldpoints_import(shp_path):
    rows = _read_fieldpoint_rows(shp_path)

    if not rows:
        raise ShapefileImportError("The FieldPoints shapefile contains no features.")

    _validate_fk(rows, "mauza_id", Mauza, "mauza_id", "Mauza")

    with transaction.atomic():
        # FieldPoints.gid is an IntegerField primary key in the existing model,
        # so the shapefile does not need to carry gid. Generate sequential IDs
        # safely from the current table maximum.
        with connection.cursor() as cursor:
            cursor.execute('LOCK TABLE "fieldpoints" IN EXCLUSIVE MODE')

        current_max_gid = (
            FieldPoints.objects.aggregate(max_gid=Max("gid"))["max_gid"] or 0
        )

        objects = []
        for offset, row in enumerate(rows, start=1):
            row["gid"] = current_max_gid + offset
            objects.append(FieldPoints(**row))

        FieldPoints.objects.bulk_create(objects, batch_size=1000)

    return len(rows)
