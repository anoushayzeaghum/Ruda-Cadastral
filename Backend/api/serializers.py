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

        # avoid None issues on optional fields
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

# --------------------------------------------------------
# Division Serializer
# --------------------------------------------------------

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
        id_field = "mouza_id"

        fields = (
            "gid",
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
        id_field = "gid"

        fields = (
            "gid",
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
        id_field = "gid"

        fields = (
            "gid",
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
        
# --------------------------------------------------------
# Ruda Phases Boundary Serializer
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