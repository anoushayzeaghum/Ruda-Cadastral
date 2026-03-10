from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import *

# --------------------------------------------------------
# Division Serializer
# --------------------------------------------------------

from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Division


class DivisionSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Division
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "division",
            "division_i",
            "geom",
        )
        
# --------------------------------------------------------
# District Serializer
# --------------------------------------------------------

class DistrictSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = District
        geo_field = "geom"
        id_field = "id"

        fields = (
            "id",
            "name",
            "division",
            "division_i",
            "extent",
            "shape_star",
            "shape_stle",
            "geom",
        )

# --------------------------------------------------------
# Tehsil Serializer
# --------------------------------------------------------

class TehsilSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Tehsil
        geo_field = "geom"
        id_field = "id"

        fields = (
            "id",
            "name",
            "district",
            "district_i",
            "extent",
            "shape_star",
            "shape_stle",
            "geom",
        )

# --------------------------------------------------------
# Mouza Serializer
# --------------------------------------------------------
class MouzaSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Mouza
        geo_field = "geom"
        id_field = "id"

        fields = (
            "id",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "qh",
            "qh_id",
            "pc",
            "pc_id",
            "mouza",
            "mouza_id",
            "geom",
        )
        
# --------------------------------------------------------
# Murabba Serializer
# --------------------------------------------------------
class MurabbaSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Murabba
        geo_field = "geom"
        id_field = "id"

        fields = (
            "id",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "qh",
            "qh_id",
            "pc",
            "pc_id",
            "mouza",
            "mouza_id",
            "murabba_no",
            "sheets",
            "geom",
        )
# --------------------------------------------------------
# Khasra Serializer
# --------------------------------------------------------
class KhasraSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Khasra
        geo_field = "geom"
        id_field = "id"

        fields = (
            "id",
            "join_shp",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "qh",
            "qh_id",
            "pc",
            "pc_id",
            "mouza",
            "mouza_id",
            "type",
            "m",
            "a",
            "k",
            "sk",
            "label",
            "karam",
            "remarks",
            "khasra_id",
            "b",
            "mn",
            "division",
            "khewat_id",
            "divn_id",
            "geom",
        )