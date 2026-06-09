import json


def geom_to_geojson(geom):
    """Convert a GEOS geometry object to a GeoJSON dict."""
    return json.loads(geom.geojson)


def feature_collection(features):
    return {"type": "FeatureCollection", "features": features}


def make_feature(geometry_geojson, properties):
    return {"type": "Feature", "geometry": geometry_geojson, "properties": properties}
