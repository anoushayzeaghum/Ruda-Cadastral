from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import *

# --------------------------------------------------------
# Mouza Serializer
# --------------------------------------------------------
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Mouza


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

# --------------------------------------------------------
# Khasra Serializer
# --------------------------------------------------------