from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import *

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