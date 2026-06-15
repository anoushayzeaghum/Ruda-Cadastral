from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import *


# --------------------------------------------------------
# MyUser Serializer
# --------------------------------------------------------

class MyUserSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MyUser
        fields = [
            "id",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "company_name",
            "role",
            "address",
            "contact",
            "is_active",
            "password",
        ]

        extra_kwargs = {
            "password": {"write_only": True, "required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
            "company_name": {"required": True},
            "email": {"required": True},
            "role": {"required": False},
            "address": {"required": False, "allow_blank": True},
            "contact": {"required": False, "allow_blank": True},
            "is_active": {"read_only": True},
        }

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        validated_data["address"] = validated_data.get("address", "") or ""
        validated_data["contact"] = validated_data.get("contact", "") or ""
        validated_data["role"] = validated_data.get("role", "admin")

        user = MyUser(**validated_data)

        if password:
            user.set_password(password)

        if validated_data.get("role") in ["admin", "super_admin"]:
            user.is_staff = True

        user.is_active = True
        user.save()
        return user


class MyUserLoginDashboardSerializer(serializers.ModelSerializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MyUser
        fields = [
            "id",
            "email",
            "password",
            "full_name",
            "is_active",
        ]

        extra_kwargs = {
            "password": {"write_only": True},
        }

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


# --------------------------------------------------------
# District Serializer
# Main hierarchy starts from District
# --------------------------------------------------------

class DistrictSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = District
        geo_field = "geom"
        id_field = "id"

        fields = (
            "gid",
            "id",
            "objectid",
            "name",
            "extent",
            "shape_star",
            "shape_stle",
            "geom",
        )


# --------------------------------------------------------
# Tehsil Serializer
# District → Tehsil
# --------------------------------------------------------

class TehsilSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Tehsil
        geo_field = "geom"
        id_field = "id"

        fields = (
            "gid",
            "id",
            "objectid",
            "name",
            "district",
            "district_i",
            "extent",
            "shape_star",
            "shape_stle",
            "geom",
        )


# --------------------------------------------------------
# Mauza Serializer
# District → Tehsil → Mauza
# --------------------------------------------------------

class MauzaSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Mauza
        geo_field = "geom"
        id_field = "mauza_id"

        fields = (
            "gid",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "mauza",
            "mauza_id",
            "geom",
        )


# --------------------------------------------------------
# Murabba Serializer
# District → Tehsil → Mauza → Murabba
# --------------------------------------------------------

class MurabbaSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Murabba
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "mauza",
            "mauza_id",
            "murabba_no",
            "sheets",
            "geom",
        )


# --------------------------------------------------------
# Khasra Serializer - New Format
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------

class KhasraSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Khasra
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "join_shp",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "mauza",
            "mauza_id",
            "hadbust_no",
            "asse_cir",
            "karam",
            "type",
            "sq",
            "kh",
            "sk",
            "khasra_id",
            "khewat_id",
            "khatoni_no",
            "dc_rate",
            "remarks",
            "b",
            "geom",
        )

# --------------------------------------------------------
# Society Serializer
# District → Tehsil → Mauza → Society
# --------------------------------------------------------
class SocietySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Society
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "source",
            "feat_count",
            "area",
            "society",
            "society_id",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "mauza",
            "mauza_id",
            "geom",
        )

# --------------------------------------------------------
# MasterPlan Serializer
# District → Tehsil → Mauza → Society → MasterPlan
# -------------------------------------------------------
class MasterPlanSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = MasterPlan
        geo_field = "geom"
        id_field = "gid"
        fields = (
            "gid",
            "society_id",
            "mauza_id",
            "dist_id",
            "tehsil_id",
            "land_use",
            "height",
            "geom",
        )

# --------------------------------------------------------
# SpotLevel Serializer
# District → Tehsil → Mauza → Society → SpotLevel
# -------------------------------------------------------



class SpotLevelSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = SpotLevel
        geo_field = "geom"
        id_field = "gid"
        fields = (
            "gid",
            "society_id",
            "mauza_id",
            "dist_id",
            "tehsil_id",
            "geom",
        )


# --------------------------------------------------------
# Contour Serializer
# District → Tehsil → Mauza → Society → Contour
# --------------------------------------------------------

class ContourSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Contour
        geo_field = "geom"
        id_field = "gid"
        fields = (
            "gid",
            "society_id",
            "mauza_id",
            "dist_id",
            "tehsil_id",
            "geom",
        )

# --------------------------------------------------------
# Ruda Proposed Roads Serializer
# --------------------------------------------------------
class RudaProposedRoadsSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = RudaProposedRoads
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "kml_id",
            "name",
            "kml_desc",
            "fid",
            "entity",
            "layer",
            "color",
            "linetype",
            "elevation",
            "linewt",
            "refname",
            "geom",
        )
# --------------------------------------------------------
# Ruda Boundary Serializer
# --------------------------------------------------------

class RudaBoundarySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RudaBoundary
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "oid",
            "name",
            "folderpath",
            "symbolid",
            "altmode",
            "base",
            "clamped",
            "extruded",
            "snippet",
            "popupinfo",
            "shape_leng",
            "shape_area",
            "geom",
        )


# --------------------------------------------------------
# Trijunction Serializer
# --------------------------------------------------------

class TrijunctionSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Trijunction
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "type",
            "m1",
            "m1_id",
            "m2",
            "m2_id",
            "m3",
            "m3_id",
            "layer",
            "path",
            "geom",
        )
# --------------------------------------------------------
# Square Serializer

# --------------------------------------------------------

class SquareSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Square
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "mauza",
            "mauza_id",
            "sq",
            "geom",
        )

# --------------------------------------------------------
# Acre Serializer

# --------------------------------------------------------

class AcreSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Acre
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "dist_id",
            "tehsil",
            "tehsil_id",
            "mauza",
            "mauza_id",
            "sq",
            "acre",
            "geom",
        )

# --------------------------------------------------------
# FieldPoints Serializer

class FieldPointsSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = FieldPoints
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "layer",
            "gm_type",
            "pid",
            "code",
            "elevation",
            "geom",
        )

# --------------------------------------------------------
# GeodeticNetwork Serializer

class GeodeticNetworkSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = GeodeticNetwork
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "easting_m",
            "northing_m",
            "code",
            "elevation",
            "geom",
        )