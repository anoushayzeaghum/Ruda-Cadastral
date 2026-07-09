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
    district_i = serializers.IntegerField(
        source="district_id",
        read_only=True
    )

    district_name = serializers.CharField(
        source="district.name",
        read_only=True
    )

    class Meta:
        model = Tehsil
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "id",
            "objectid",
            "name",
            "district",        # FK value
            "district_i",      # same value as district_id
            "district_name",   # Kasur
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
    district_name = serializers.CharField(
        source="district.name",
        read_only=True
    )

    tehsil_name = serializers.CharField(
        source="tehsil.name",
        read_only=True
    )

    class Meta:
        model = Mauza
        geo_field = "geom"
        id_field = "mauza_id"

        fields = (
            "gid",
            "district",       # FK value
            "district_id",    # same value as dist_id column
            "district_name",

            "tehsil",         # FK value
            "tehsil_id",      # same value as tehsil_id column
            "tehsil_name",

            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "mauza",
            "mauza_id",
            "geom",
        )


# --------------------------------------------------------
# Khasra Serializer - New Format
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------
class KhasraSerializer(GeoFeatureModelSerializer):

    district_name = serializers.SerializerMethodField()
    tehsil_name = serializers.SerializerMethodField()
    mauza_name = serializers.SerializerMethodField()

    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_tehsil_name(self, obj):
        return obj.tehsil.name if obj.tehsil else None

    def get_mauza_name(self, obj):
        return obj.mauza.mauza if obj.mauza else None

    class Meta:
        model = Khasra
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "join_shp",

            "district_id",
            "tehsil_id",
            "mauza_id",

            "district_name",
            "tehsil_name",
            "mauza_name",

            "kc",
            "kc_id",
            "pc",
            "pc_id",

            "hadbust_no",
            "asse_cir",
            "type",
            "karam",
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
# Project Serializer
# --------------------------------------------------------
class ProjectSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Project
        geo_field = "geom"
        id_field = "gid"
        fields = (
            "gid",
            "name", "type", "brief_name",
            "geom"
        )


    
# --------------------------------------------------------
# ProjectMauza Serializer
# --------------------------------------------------------
class ProjectMauzaSerializer(serializers.ModelSerializer):

    project_name = serializers.CharField(
        source="project.name",
        read_only=True
    )

    mauza_name = serializers.CharField(
        source="mauza.mauza",
        read_only=True
    )

    khasra_no = serializers.CharField(
        source="khasra.kh",
        read_only=True
    )

    # ADD THESE
    mauza_detail = MauzaSerializer(
        source="mauza",
        read_only=True
    )

    khasra_detail = KhasraSerializer(
        source="khasra",
        read_only=True
    )

    class Meta:
        model = ProjectMauza
        fields = (
            "id",

            "project",
            "project_name",

            "mauza",
            "mauza_name",
            "mauza_detail",

            "khasra",
            "khasra_no",
            "khasra_detail",

            "square_id",
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
            "mauza",
            "district",
            "tehsil",
            "project",
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
            "mauza",
            "district",
            "tehsil",
            "project",
            "elevation",
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

    # FK ids
    m1_id = serializers.FloatField(read_only=True)
    m2_id = serializers.FloatField(read_only=True)
    m3_id = serializers.FloatField(read_only=True)

    mauza_id = serializers.FloatField(read_only=True)

    # Mauza name
    mauza_name = serializers.CharField(
        source="mauza.mauza",
        read_only=True
    )

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

            "mauza_id",
            "mauza_name",

            "layer",
            "geom",
        )
# --------------------------------------------------------
# Square Serializer

# --------------------------------------------------------

class SquareSerializer(GeoFeatureModelSerializer):
    district_name = serializers.SerializerMethodField()
    tehsil_name = serializers.SerializerMethodField()
    mauza_name = serializers.SerializerMethodField()

    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_tehsil_name(self, obj):
        return obj.tehsil.name if obj.tehsil else None

    def get_mauza_name(self, obj):
        return obj.mauza.mauza if obj.mauza else None

    class Meta:
        model = Square
        geo_field = "geom"
        id_field = "gid"
        fields = (
            "gid",
            "district",
            "district_name",
            "tehsil",
            "tehsil_name",
            "mauza",
            "mauza_name",
            "kc",
            "kc_id",
            "pc",
            "pc_id",
            "sq",
            "square_id",
            "layer",
            "geom",
        )
    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_tehsil_name(self, obj):
        return obj.tehsil.name if obj.tehsil else None

    def get_mauza_name(self, obj):
        return obj.mauza.mauza if obj.mauza else None
    

# --------------------------------------------------------
# Acre Serializer

# --------------------------------------------------------

class AcreSerializer(GeoFeatureModelSerializer):

    district_name = serializers.CharField(
        source="district.name",
        read_only=True,
        allow_null=True,
    )

    tehsil_name = serializers.CharField(
        source="tehsil.name",
        read_only=True,
        allow_null=True,
    )

    mauza_name = serializers.CharField(
        source="mauza.mauza",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Acre
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "tehsil",
            "mauza",
            "district_name",
            "tehsil_name",
            "mauza_name",
            "sq",
            "acre",
            "layer",
            "geom",
        )
        
# --------------------------------------------------------
# FieldPointsx Serializer
# --------------------------------------------------------
class FieldPointsSerializer(GeoFeatureModelSerializer):

    mauza_name = serializers.SerializerMethodField()

    def get_mauza_name(self, obj):
        return obj.mauza.mauza if obj.mauza else None

    class Meta:
        model = FieldPoints
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "easting",
            "northing",
            "elevation",

            # FK
            "mauza",

            # readable name
            "mauza_name",

            "layer",
            "geom",
        )
# --------------------------------------------------------
# GeodeticNetwork Serializer
# --------------------------------------------------------
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


# --------------------------------------------------------
# Block Serializer
# --------------------------------------------------------

class BlockSerializer(GeoFeatureModelSerializer):

    project_name = serializers.CharField(
        source="project.name",
        read_only=True
    )

    class Meta:
        model = Block
        geo_field = "geom"

        fields = (
            "gid",
            "name",
            "area",
            "block",

            "project",
            "project_name",

            "geom",
        )


# --------------------------------------------------------
# BlockLevel Serializer
# --------------------------------------------------------
class BlockLevelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = BlockLevel
        geo_field = "geom"
        fields = (
            "gid",
            "name",
            "block",
            "dimension",
        )

# --------------------------------------------------------
# Plot Serializer
# --------------------------------------------------------
class PlotSerializer(GeoFeatureModelSerializer):

    project_name = serializers.CharField(
        source="project.name",
        read_only=True
    )

    block_name = serializers.CharField(
        source="block.name",
        read_only=True
    )

    class Meta:
        model = Plot
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "project",
            "project_name",

            "block",
            "block_name",

            "type",
            "remarks",

            "plot_no",
            "plot_area",

            "shape_leng",
            "shape_area",
            "dimension",

            "parkfront",
            "rd_ft",
            "storey",
            "rd_facing",

            "h",
            "demar",

            "possession",
            "poss_st",

            "canceled",
            "site_plan",

            "unique_id",

            "tr_srno",
            "tr_own",
            "tr_p_no",
            "tr_cate",

            "geom",
        )
# --------------------------------------------------------
# Road Serializer
# --------------------------------------------------------

class RoadSerializer(GeoFeatureModelSerializer):
    # IMPORTANT:
    # The road table can contain project_id/block_id values even when the
    # related Project/Block row is missing or not enforced by a DB FK.
    # Do not serialize FK objects directly here, otherwise /api/road/ can
    # crash with a 500 when DRF tries to read project.name or block.name.
    project = serializers.IntegerField(
        source="project_id",
        required=False,
        allow_null=True,
    )
    block = serializers.IntegerField(
        source="block_id",
        required=False,
        allow_null=True,
    )

    project_name = serializers.SerializerMethodField()
    block_name = serializers.SerializerMethodField()
    block_label = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        try:
            return obj.project.name if obj.project_id and obj.project else None
        except Exception:
            return None

    def get_block_name(self, obj):
        try:
            return obj.block.name if obj.block_id and obj.block else None
        except Exception:
            return None

    def get_block_label(self, obj):
        try:
            return obj.block.block if obj.block_id and obj.block else None
        except Exception:
            return None

    class Meta:
        model = Road
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",

            "project",
            "project_name",

            "block",
            "block_name",
            "block_label",

            "dimension",
            "type",
            "row",
            "geom",
        )


# --------------------------------------------------------
# CameraLocation Serializer
# --------------------------------------------------------

class CameraLocationSerializer(GeoFeatureModelSerializer):

    project_name = serializers.CharField(
        source="project_fk.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = CameraLocation
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "sr_no",
            "project",
            "camera",

            # FK
            "project_fk",

            # readable name
            "project_name",

            "y",
            "x",
            "coordinate",
            "iframe_lin",
            "geom",
        )
# --------------------------------------------------------
# SWPoint Serializer
# --------------------------------------------------------

class SWPointSerializer(GeoFeatureModelSerializer):

    project_id = serializers.IntegerField(
        source="project.gid",
        read_only=True,
        allow_null=True,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = SWPoint
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "type",
            "name",

            # FK values
            "project_id",
            "project_name",

            "geom",
        )

# --------------------------------------------------------
# WSL Serializer
# --------------------------------------------------------
class WSLSerializer(GeoFeatureModelSerializer):

    project_id = serializers.IntegerField(
        source="project.gid",
        read_only=True,
        allow_null=True,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = WSL
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "shape_leng",
            "dia",
            "type",
            "name",

            # FK fields
            "project_id",
            "project_name",

            "geom",
        )

# --------------------------------------------------------
# WSPoint Serializer
# --------------------------------------------------------
class WSPointSerializer(GeoFeatureModelSerializer):
    project_id = serializers.IntegerField(
        source="project.gid",
        read_only=True,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )

    class Meta:
        model = WSPoint
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "type",
            "name",
            "project_id",
            "project_name",
            "geom",
        )