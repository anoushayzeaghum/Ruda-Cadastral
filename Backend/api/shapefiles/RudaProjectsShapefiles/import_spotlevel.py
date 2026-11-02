"""Import Spot_Levels.shp with OBJECTID, Id, X, Y and ZZ.

A selected project is mandatory: existing imports did not assign project_id,
so project-filtered frontend requests could not reliably find the new data.
"""

import math
from decimal import Decimal, InvalidOperation
from django.contrib.gis.gdal import DataSource
from django.db import transaction
from ...models import Project, SpotLevel


REQUIRED_FIELDS = ("OBJECTID", "Id", "X", "Y", "ZZ")


def _number(value, name, index, integer=False):
    if value is None or str(value).strip() == "":
        raise ValueError(f"Record {index}: required field {name} is empty.")
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Record {index}: {name} is not numeric: {value!r}") from exc
    if not math.isfinite(number):
        raise ValueError(f"Record {index}: {name} must be finite.")
    if integer:
        if not number.is_integer():
            raise ValueError(f"Record {index}: {name} must be an integer.")
        return int(number)
    return number


def _attribute_text(value, name, index):
    """Preserve shapefile X/Y as attributes, with NO coordinate transform."""
    if value is None or str(value).strip() == "":
        raise ValueError(f"Record {index}: required field {name} is empty.")
    text = str(value).strip()
    try:
        number = Decimal(text)
    except InvalidOperation as exc:
        raise ValueError(f"Record {index}: {name} is not numeric: {text!r}") from exc
    if not number.is_finite():
        raise ValueError(f"Record {index}: {name} must be finite.")
    if len(text) > 50:
        raise ValueError(f"Record {index}: {name} exceeds 50 characters.")
    return text


def _elevation_decimal(value, index):
    if value is None or str(value).strip() == "":
        raise ValueError(f"Record {index}: required field ZZ is empty.")
    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(f"Record {index}: ZZ is not numeric: {value!r}") from exc
    if not number.is_finite():
        raise ValueError(f"Record {index}: ZZ must be finite.")
    return number


def run_shapefile_import(shp_path, project_id, replace=False):
    """Import a complete Spot Level dataset for one project.

    If replace=True, only rows for this project are replaced. Validation and
    insertion run before commit, so an invalid upload cannot erase old rows.
    """
    if not project_id:
        raise ValueError("project_id is required for Spot Level import.")
    project = Project.objects.filter(pk=project_id).first()
    if project is None:
        raise ValueError(f"Project {project_id} not found.")

    dataset = DataSource(str(shp_path))
    layer = dataset[0]
    source_fields = {name.casefold(): name for name in layer.fields}
    missing = [field for field in REQUIRED_FIELDS if field.casefold() not in source_fields]
    if missing:
        raise ValueError("Missing Spot Level shapefile columns: " + ", ".join(missing))
    if layer.srs is None:
        raise ValueError("Spot Level shapefile has no CRS (.prj is required).")

    def value(feature, field):
        return feature.get(source_fields[field.casefold()])

    instances = []
    for index, feature in enumerate(layer, start=1):
        geometry = feature.geom
        if geometry is None or geometry.geom_type.name.lower() not in ("point", "point25d", "pointz"):
            raise ValueError(f"Record {index}: Spot Level geometry must be a Point.")
        # The uploaded .prj is UTM Zone 43N in feet; transform the POINT only.
        # X/Y attributes must remain exactly as recorded in the shapefile.
        geometry.srs = layer.srs
        geometry.transform(4326)
        point = geometry.geos
        point.srid = 4326

        instances.append(SpotLevel(
            project_id=project.pk,
            objectid=_number(value(feature, "OBJECTID"), "OBJECTID", index),
            id=_number(value(feature, "Id"), "Id", index),
            x=_attribute_text(value(feature, "X"), "X", index),
            y=_attribute_text(value(feature, "Y"), "Y", index),
            zz=_elevation_decimal(value(feature, "ZZ"), index),
            geom=point,
        ))

    if not instances:
        raise ValueError("The Spot Level shapefile has no features.")

    # Keep all the changes atomic; old records survive on import failure.
    with transaction.atomic():
        # Lock project so two replacements of the same project cannot overlap.
        Project.objects.select_for_update().get(pk=project.pk)
        existing = SpotLevel.objects.filter(project_id=project.pk)
        if existing.exists() and not replace:
            raise ValueError(
                "This project already has Spot Level records. "
                "Set replace=true to replace only this project's Spot Levels."
            )
        if replace:
            existing.delete()
        SpotLevel.objects.bulk_create(instances, batch_size=500)

    return {"imported": len(instances), "project_id": project.pk, "replaced": bool(replace)}
