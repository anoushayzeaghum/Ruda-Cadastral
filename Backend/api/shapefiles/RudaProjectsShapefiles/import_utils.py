from django.contrib.gis.utils import LayerMapping
from django.contrib.gis.gdal import DataSource


def import_model_shapefile(
    model,
    shp_path,
    field_aliases,
    geometry_type,
    required_fields=(),
):
    ds = DataSource(shp_path)
    layer = ds[0]
    fields_by_name = {field.casefold(): field for field in layer.fields}
    mapping = {}
    missing = []

    for model_field, aliases in field_aliases.items():
        source_field = next(
            (
                fields_by_name[alias.casefold()]
                for alias in aliases
                if alias.casefold() in fields_by_name
            ),
            None,
        )
        if source_field:
            mapping[model_field] = source_field
        elif model_field in required_fields:
            missing.append(
                f"{model_field} (accepted: {', '.join(aliases)})"
            )

    if missing:
        raise ValueError(
            f"Missing fields in shapefile: {', '.join(missing)}"
        )

    mapping["geom"] = geometry_type
    LayerMapping(
        model,
        shp_path,
        mapping,
        transform=True,
        encoding="utf-8",
    ).save(strict=True, verbose=True)

    return mapping
