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

    class Meta:
        model = Mauza
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
            "mauza",
            "mauza_id",
            "pc",
            "pc_id",
            "geom",
        )

        read_only_fields = (
            "gid",
        )

# --------------------------------------------------------
# Ruda Mauza Serializer
# District → Tehsil → Mauza
# --------------------------------------------------------

class RudaMauzaSerializer(GeoFeatureModelSerializer):
    # Keep the old field names "district" and "tehsil", but read them from the
    # raw FK id values to avoid unnecessary FK lookups during GeoJSON output.
    district = serializers.IntegerField(
        source="district_id",
        read_only=True,
        allow_null=True,
    )

    tehsil = serializers.IntegerField(
        source="tehsil_id",
        read_only=True,
        allow_null=True,
    )

    district_name = serializers.SerializerMethodField()
    tehsil_name = serializers.SerializerMethodField()

    def get_district_name(self, obj):
        try:
            return obj.district.name if obj.district else obj.district_text
        except Exception:
            return obj.district_text

    def get_tehsil_name(self, obj):
        try:
            return obj.tehsil.name if obj.tehsil else obj.tehsil_text
        except Exception:
            return obj.tehsil_text

    class Meta:
        model = RudaMauza
        geo_field = "geom"
        id_field = "mauza_id"

        fields = (
            "gid",

            # Raw shapefile text columns.
            "district_text",
            "tehsil_text",

            # Existing FK/id fields used by the current API and frontend.
            "district",
            "district_id",
            "district_name",

            "tehsil",
            "tehsil_id",
            "tehsil_name",

            "kc",
            "kc_id",
            "pc",

            "mauza",
            "mauza_id",

            # New Mauza shapefile columns.
            "notified_b",
            "proposed_b",
            "new_ext",
            "prepared_b",
            "remarks",

            "geom",
        )
        
# --------------------------------------------------------
# Khasra Serializer
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------
class KhasraSerializer(GeoFeatureModelSerializer):
    district_name = serializers.CharField(
        source="district",
        read_only=True,
        allow_null=True,
    )

    tehsil_name = serializers.CharField(
        source="tehsil",
        read_only=True,
        allow_null=True,
    )

    mauza_name = serializers.CharField(
        source="mauza",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Khasra
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",

            # Administrative hierarchy
            "district",
            "dist_id",
            "district_name",

            "tehsil",
            "tehsil_id",
            "tehsil_name",

            "kc",
            "kc_id",

            "pc",
            "pc_id",

            "mauza",
            "mauza_id",
            "mauza_name",

            # Khasra attributes
            "hadbust_no",
            "asse_cir",
            "type",
            "karam",
            "sq",
            "kh",
            "sk",
            "join_shp",
            "khasra_id",
            "khewat_id",
            "khatoni_no",
            "dc_rate",
            "remarks",
            "b",

            # Geometry
            "geom",
        )

        read_only_fields = (
            "gid",
        )
        
# --------------------------------------------------------
# Ruda Khasra Serializer - New Format
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------
class RudaKhasraSerializer(GeoFeatureModelSerializer):

    # The imported table already contains these names. Reading the text columns
    # directly avoids three related-object accesses for every feature.
    district_name = serializers.CharField(
        source="district_text",
        read_only=True,
        allow_null=True,
    )
    tehsil_name = serializers.CharField(
        source="tehsil_text",
        read_only=True,
        allow_null=True,
    )
    mauza_name = serializers.CharField(
        source="mauza_text",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = RudaKhasra
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",

            # Raw shapefile text columns.
            "district_text",
            "tehsil_text",
            "mauza_text",

            # Existing FK/id fields used by the current API and frontend.
            "district_id",
            "tehsil_id",
            "mauza_id",

            "district_name",
            "tehsil_name",
            "mauza_name",

            "remarks",
            "area_sqft",
            "shape_leng",
            "shape_area",

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

            "join_shp",

            "khasra_id",
            "khewat_id",
            "khatoni_no",
            "dc_rate",
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

# -----------------------------------------------------------------------------------------------------------
# ***RUDA LMASTER PLAN SERIALIZERS***
# -----------------------------------------------------------------------------------------------------------

# --------------------------------------------------------
# Existing Forest Serializer
# --------------------------------------------------------
class ExistingForestSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = ExistingForest
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "type",
            "source",
            "lu_type",
            "status",
            "comments",
            "area_sqfee",
            "area_acre",
            "area_225ac",
            "geom",
        )


# --------------------------------------------------------
# RUDA Mp Principle Zoning Serializer
# --------------------------------------------------------
class MpPrincipleZoningSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = MpPrincipleZoning
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "area225a",
            "zoning_cat",
            "area_sqft",
            "geom",
        )

# --------------------------------------------------------
# City Level Service Serializer
# --------------------------------------------------------
class CityLevelServiceSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = CityLevelService
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "layer",
            "gm_type",
            "elevation",
            "name",
            "area_225ac",
            "type",
            "geom",
        )


# --------------------------------------------------------
# Forest Boundary Serializer
# --------------------------------------------------------
class ForestBoundarySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = ForestBoundary
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "f_zone",
            "f_circle",
            "f_div",
            "f_name",
            "gps_area",
            "gross_area",
            "f_type",
            "legal_stat",
            "shape_leng",
            "shape_area",
            "geom",
        )


# --------------------------------------------------------
# Precient Boundary Serializer
# --------------------------------------------------------
class PrecientBoundarySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = PrecientBoundary
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "area_acre",
            "phases",
            "phases_new",
            "shape_leng",
            "shape_area",
            "area_sqft",
            "area_225ac",
            "name",
            "geom",
        )


# --------------------------------------------------------
# River Serializer
# --------------------------------------------------------
class RiverSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = River
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "layer",
            "name",
            "area_sqft",
            "area_225ac",
            "geom",
        )


# --------------------------------------------------------
# River Ravi Serializer
# --------------------------------------------------------
class RiverRaviSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RiverRavi
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "type",
            "area",
            "geom",
        )


# --------------------------------------------------------
# RUDA Jurisdiction Serializer
# --------------------------------------------------------
class RudaJurisdictionSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RudaJurisdiction
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "area_usacr",
            "phases",
            "districts",
            "name",
            "tehsils",
            "geom",
        )


# --------------------------------------------------------
# City Level Service Points Serializer
# --------------------------------------------------------
class CityLevelServicePointsSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = CityLevelServicePoints
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "layer",
            "gm_type",
            "name",
            "area_225ac",
            "type",
            "orig_fid",
            "elevation",
            "geom",
        )

# --------------------------------------------------------
# RUDA Planning Boundary Serializer
# --------------------------------------------------------
class RudaPlanningBoundarySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RudaPlanningBoundary
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "area_usacr",
            "name",
            "area_sqft",
            "area_225ac",
            "geom",
        )


# --------------------------------------------------------
# Proposed Road Network Serializer
# --------------------------------------------------------
class ProposedRoadNetworkSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = ProposedRoadNetwork
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "gm_layer",
            "gm_type",
            "elevation",
            "layer",
            "geom",
        )

# =================================================================================================
# IMPORTED LAND TABLE SERIALIZERS
# =================================================================================================

# --------------------------------------------------------
# State Land Serializer
# DB table: stateland
# --------------------------------------------------------
class StateLandSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = StateLand
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "tehsil",
            "mouza",
            "square",
            "khasra",
            "sub_khasra",
            "khasra_lab",
            "remarks",
            "state_land",
            "area_sqft",
            "date",
            "geom",
        )


# --------------------------------------------------------
# RTW Alignment Serializer
# DB table: rtwalignment
# --------------------------------------------------------
class RtwAlignmentSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RtwAlignment
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "package",
            "length",
            "area_sqft",
            "area_ac225",
            "date",
            "geom",
        )


# --------------------------------------------------------
# Possession Land Serializer
# DB table: possessionland
# --------------------------------------------------------
class PossessionLandSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = PossessionLand
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "tehsil",
            "mouza",
            "square",
            "khasra",
            "khasra_lab",
            "award_zone",
            "projects",
            "l_type",
            "land_owner",
            "lp_name",
            "remarks",
            "date",
            "geom",
        )


# --------------------------------------------------------
# Awarded Land Serializer
# DB table: awardedland
# --------------------------------------------------------
class AwardedLandSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = AwardedLand
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "tehsil",
            "mouza",
            "square",
            "khasra",
            "sub_khasra",
            "khasra_lab",
            "agri_river",
            "land_type",
            "remarks",
            "area_sqft",
            "date",
            "geom",
        )

# --------------------------------------------------------
# RTW Package Serializer
# DB table: rtwpackage
# --------------------------------------------------------
class RtwPackageSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RtwPackage
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "layer",
            "map_name",
            "name",
            "package",
            "area_acres",
            "closed",
            "label_pos",
            "ruda_phase",
            "area_sqkm",
            "aaa",
            "geom",
        )

#-----------------------------------------
# Branch Canal Serializer
#-----------------------------------------

class BranchCanalSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = BranchCanal
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "imis_code",
            "division",
            "parent_ch",
            "remarks",
            "zone",
            "circle",
            "name",
            "canal_type",
            "gca",
            "cca",
            "designed_d",
            "tail_rd",
            "a_tail_g",
            "a_tail_d",
            "flow_type",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

#-----------------------------------------
# Distributary Serializer
#-----------------------------------------
class DistributarySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Distributary
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "imis_code",
            "division",
            "parent_ch",
            "remarks",
            "zone",
            "circle",
            "name",
            "canal_type",
            "gca",
            "cca",
            "designed_d",
            "tail_rd",
            "a_tail_g",
            "a_tail_d",
            "flow_type",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

#---------------------------------------------
# Existing Drains Serializer
#---------------------------------------------
class ExistingDrainsSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = ExistingDrains
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "name",
            "layer",
            "kml_folder",
            "length",
            "shape_leng",
            "geom",
        )

#---------------------------------------------
# Irrigation Network Serializer
#---------------------------------------------
class IrrigationNetworkSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = IrrigationNetwork
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "imis_code",
            "division",
            "parent_ch",
            "remarks",
            "zone",
            "circle",
            "name",
            "canal_type",
            "gca",
            "cca",
            "designed_d",
            "tail_rd",
            "a_tail_g",
            "a_tail_d",
            "flow_type",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

#----------------------------------------------
# Katar Band WWTP Serializer
#----------------------------------------------
class KatarBandWWTPSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = KatarBandWWTP
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "area",
            "geom",
        )

#-----------------------------------------------
# Link Canal Serializer
#-----------------------------------------------
class LinkCanalSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = LinkCanal
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "imis_code",
            "division",
            "parent_ch",
            "remarks",
            "zone",
            "circle",
            "name",
            "canal_type",
            "gca",
            "cca",
            "designed_d",
            "tail_rd",
            "a_tail_g",
            "a_tail_d",
            "flow_type",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

#-----------------------------------------------
# Proposed WWTP Serializer
#-----------------------------------------------

class ProposedWWTPSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = ProposedWWTP
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "area",
            "descriptio",
            "geom",
        )

#-----------------------------------------------
# SWTP Site Serializer
#-----------------------------------------------
class SWTPSiteSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = SWTPSite
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "id",
            "name",
            "sq_ft",
            "marla",
            "kanal",
            "acres",
            "geom",
        )

#-----------------------------------------------
# WWTP Sites Serializer
#-----------------------------------------------

class WWTPSitesSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = WWTPSites
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "name",
            "site_type",
            "shape_leng",
            "shape_area",
            "created_us",
            "created_da",
            "last_edite",
            "last_edi_1",
            "area",
            "geom",
        )

# --------------------------------------------------------
# RTW Package Serializer
# DB table: rtwpackage
# --------------------------------------------------------

class AbdulHakeemMotorwayM3Serializer(GeoFeatureModelSerializer):

    class Meta:
        model = AbdulHakeemMotorwayM3
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "name",
            "layer",
            "kml_style",
            "tessellate",
            "name_1",
            "name_2",
            "shape_leng",
            "geom",
        )

# --------------------------------------------------------
# RTW Package Serializer
# DB table: rtwpackage
# --------------------------------------------------------

class HardoSohalMuslimRoadSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = HardoSohalMuslimRoad
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "row",
            "category",
            "name",
            "length_km",
            "remarks",
            "kacha_pacc",
            "shape_leng",
            "geom",
        )


class JinnahAvenueSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = JinnahAvenue
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "row",
            "category",
            "name",
            "length_km",
            "remarks",
            "kacha_pacc",
            "shape_leng",
            "geom",
        )


class KalaKhataiInterchangeSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = KalaKhataiInterchange
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "name",
            "layer",
            "kml_style",
            "tessellate",
            "shape_leng",
            "geom",
        )


class KatarBundRoadSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = KatarBundRoad
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
            "row",
            "buffer",
            "geom",
        )


class LahoreBypassSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = LahoreBypass
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
            "geom",
        )


class SialkotMotorwaySerializer(GeoFeatureModelSerializer):

    class Meta:
        model = SialkotMotorway
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "label",
            "length_km",
            "shape_leng",
            "geom",
        )


class TransportationRoadsSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = TransportationRoads
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "type",
            "name",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

# --------------------------------------------------------
# Lahore Ring Road Serializer
# DB table: lahoreringroad
# --------------------------------------------------------
class LahoreRingRoadSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = LahoreRingRoad
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "objectid",
            "fid",
            "entity_name",
            "layer",
            "color",
            "linetype",
            "elevation",
            "linewt",
            "refname",
            "orig_fid",
            "shape_leng",
            "shape_le_1",
            "geom",
        )

class BridgesSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Bridges
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "osm_id",
            "name",
            "ref",
            "bridge_type",
            "oneway",
            "bridge",
            "maxspeed",
            "geom",
        )

# --------------------------------------------------------
# GanjaKalanTruckStand Serializer
# DB table: ganjakalantruckstand
class GanjaKalanTruckStandSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = GanjaKalanTruckStand
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "district",
            "tehsil",
            "mouza",
            "square",
            "khasra",
            "sub_khasra",
            "khasra_lab",
            "remarks",
            "area_sqft",
            "shape_leng",
            "shape_area",
            "geom",
        )

# --------------------------------------------------------
# LahoreRapidMassTransit Serializer
# DB table: lahorerapidmasstransit
class LahoreRapidMassTransitSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = LahoreRapidMassTransit
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "name",
            "shape_leng",
            "geom",
        )

# --------------------------------------------------------
# OrangeTrack Serializer
# DB table: orangetrack
class OrangeTrackSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = OrangeTrack
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
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
            "geom",
        )

# --------------------------------------------------------
# RailwayLine Serializer
# DB table: railwayline

class RailwayLineSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RailwayLine
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid_1",
            "name",
            "shape_leng",
            "shape_le_1",
            "shape_le_2",
            "geom",
        )

class RailwayStationsSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RailwayStations
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "fid",
            "entity",
            "layer",
            "color",
            "linetype",
            "elevation",
            "linewt",
            "refname",
            "shape_leng",
            "shape_area",
            "geom",
        )

# --------------------------------------------------------
# HudiaraDrain Serializer
# DB table: hudiaradrain
class HudiaraDrainSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = HudiaraDrain
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "objectid",
            "name",
            "layer",
            "drain",
            "shape_leng",
            "geom",
        )

class LahoreTransportationRoadSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = LahoreTransportationRoad
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "oid",
            "name",
            "shape_leng",
            "type",
            "popupinfo",
            "geom",
        )

        read_only_fields = (
            "gid",
        )

class RudaSquareSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = RudaSquare
        geo_field = "geom"
        id_field = "gid"

        fields = (
            "gid",
            "district",
            "tehsil",
            "mouza",
            "square",
            "geom",
        )