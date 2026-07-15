from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.auth.base_user import BaseUserManager
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth import get_user_model

from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin
)


# --------------------------------------------------------
# User Manager
# --------------------------------------------------------

class MyUserManager(BaseUserManager):

    def create_user(self, email, company_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            company_name=company_name,
            **extra_fields
        )

        user.set_password(password)
        user.is_active = True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, company_name, password=None, **extra_fields):

        extra_fields.setdefault("role", "super_admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            email,
            company_name,
            password,
            **extra_fields
        )


# --------------------------------------------------------
# Custom User Model
# --------------------------------------------------------

class MyUser(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = (
        ("super_admin", "Super Admin"),
        ("admin", "Admin"),
    )

    email = models.EmailField(max_length=255, unique=True)

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="super_admin"
    )

    country = models.CharField(max_length=200, null=True, blank=True)
    address = models.CharField(max_length=400, null=True, blank=True)
    city = models.CharField(max_length=200, null=True, blank=True)
    zipcode = models.CharField(max_length=200, null=True, blank=True)
    contact = models.CharField(max_length=20, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)

    objects = MyUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["company_name"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }


User = get_user_model()


# --------------------------------------------------------
# District Administrative Boundary
# Hierarchy starts from District
# --------------------------------------------------------

# --------------------------------------------------------
# District
# --------------------------------------------------------
class District(models.Model):
    gid = models.AutoField(primary_key=True)
    objectid = models.FloatField(null=True, blank=True)
    id = models.FloatField( unique=True, db_index=True, )
    name = models.CharField(max_length=50)
    extent = models.CharField(max_length=100, null=True, blank=True)
    shape_star = models.FloatField(null=True, blank=True)
    shape_stle = models.FloatField(null=True, blank=True)
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.name

    class Meta:
        managed = False
        db_table = "district"


# --------------------------------------------------------
# Tehsil
# District → Tehsil
# --------------------------------------------------------
class Tehsil(models.Model):
    gid = models.AutoField(primary_key=True)
    objectid = models.IntegerField(null=True, blank=True)
    id = models.FloatField()
    name = models.CharField(max_length=50)

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="district_i",
        related_name="tehsils",
        null=True,
        blank=True,
    )

    extent = models.CharField(max_length=100, null=True, blank=True)
    shape_star = models.FloatField(null=True, blank=True)
    shape_stle = models.FloatField(null=True, blank=True)
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.name

    class Meta:
        managed = False
        db_table = "tehsil"


# --------------------------------------------------------
# Mauza
# Database table: public.mauza
# --------------------------------------------------------
class Mauza(models.Model):
    gid = models.AutoField(
        primary_key=True,
        db_column="gid",
    )

    district = models.CharField(
        db_column="district",
        max_length=100,
        null=True,
        blank=True,
    )

    dist_id = models.FloatField(
        db_column="dist_id",
        null=True,
        blank=True,
    )

    tehsil = models.CharField(
        db_column="tehsil",
        max_length=100,
        null=True,
        blank=True,
    )

    tehsil_id = models.FloatField(
        db_column="tehsil_id",
        null=True,
        blank=True,
    )

    kc = models.CharField(
        db_column="kc",
        max_length=100,
        null=True,
        blank=True,
    )

    kc_id = models.FloatField(
        db_column="kc_id",
        null=True,
        blank=True,
    )

    mauza = models.CharField(
        db_column="mauza",
        max_length=150,
        null=True,
        blank=True,
    )

    mauza_id = models.FloatField(
        db_column="mauza_id",
        unique=True,
        db_index=True,
        null=True,
        blank=True,
    )

    pc = models.CharField(
        db_column="pc",
        max_length=100,
        null=True,
        blank=True,
    )

    pc_id = models.FloatField(
        db_column="pc_id",
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPolygonField(
        db_column="geom",
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.mauza or f"Mauza {self.gid}"

    class Meta:
        managed = False
        db_table = "mauza"
        
# --------------------------------------------------------
# Ruda Mauza
# District → Tehsil → Mauza
# --------------------------------------------------------
        
class RudaMauza(models.Model):
    gid = models.AutoField(primary_key=True)

   
    district_text = models.CharField(
        db_column="district",
        max_length=100,
        null=True,
        blank=True,
    )

    tehsil_text = models.CharField(
        db_column="tehsil",
        max_length=100,
        null=True,
        blank=True,
    )

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="dist_id",
        related_name="mauzas",
        null=True,
        blank=True,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="mauzas",
        null=True,
        blank=True,
    )

    kc = models.CharField(max_length=100, null=True, blank=True)
    kc_id = models.IntegerField(null=True, blank=True)

    pc = models.CharField(max_length=100, null=True, blank=True)

    mauza = models.CharField(max_length=100)
    mauza_id = models.FloatField(
        unique=True,
        null=True,
        blank=True,
    )

    notified_b = models.CharField(max_length=100, null=True, blank=True)
    proposed_b = models.CharField(max_length=100, null=True, blank=True)
    new_ext = models.CharField(max_length=100, null=True, blank=True)
    prepared_b = models.CharField(max_length=100, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.mauza

    class Meta:
        managed = False
        db_table = "ruda_mauza"

# --------------------------------------------------------
# Khasra
# Database table: public.khasra
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------
class Khasra(models.Model):
    gid = models.AutoField(
        primary_key=True,
        db_column="gid",
    )

    # ----------------------------------------------------
    # Administrative hierarchy
    # ----------------------------------------------------
    district = models.CharField(
        db_column="district",
        max_length=100,
        null=True,
        blank=True,
    )

    dist_id = models.FloatField(
        db_column="dist_id",
        null=True,
        blank=True,
    )

    tehsil = models.CharField(
        db_column="tehsil",
        max_length=100,
        null=True,
        blank=True,
    )

    tehsil_id = models.FloatField(
        db_column="tehsil_id",
        null=True,
        blank=True,
    )

    kc = models.CharField(
        db_column="kc",
        max_length=254,
        null=True,
        blank=True,
    )

    kc_id = models.FloatField(
        db_column="kc_id",
        null=True,
        blank=True,
    )

    pc = models.CharField(
        db_column="pc",
        max_length=100,
        null=True,
        blank=True,
    )

    pc_id = models.FloatField(
        db_column="pc_id",
        null=True,
        blank=True,
    )

    mauza = models.CharField(
        db_column="mauza",
        max_length=150,
        null=True,
        blank=True,
    )

    mauza_id = models.FloatField(
        db_column="mauza_id",
        null=True,
        blank=True,
    )

    # ----------------------------------------------------
    # Khasra attributes
    # ----------------------------------------------------
    hadbust_no = models.IntegerField(
        db_column="hadbust_no",
        null=True,
        blank=True,
    )

    asse_cir = models.CharField(
        db_column="asse_cir",
        max_length=100,
        null=True,
        blank=True,
    )

    type = models.CharField(
        db_column="type",
        max_length=50,
        null=True,
        blank=True,
    )

    karam = models.DecimalField(
        db_column="karam",
        max_digits=20,
        decimal_places=11,
        null=True,
        blank=True,
    )

    sq = models.IntegerField(
        db_column="sq",
        null=True,
        blank=True,
    )

    kh = models.IntegerField(
        db_column="kh",
        null=True,
        blank=True,
    )

    sk = models.CharField(
        db_column="sk",
        max_length=50,
        null=True,
        blank=True,
    )

    join_shp = models.CharField(
        db_column="join_shp",
        max_length=100,
        null=True,
        blank=True,
    )

    khasra_id = models.FloatField(
        db_column="khasra_id",
        null=True,
        blank=True,
    )

    khewat_id = models.FloatField(
        db_column="khewat_id",
        null=True,
        blank=True,
    )

    khatoni_no = models.FloatField(
        db_column="khatoni_no",
        null=True,
        blank=True,
    )

    dc_rate = models.FloatField(
        db_column="dc_rate",
        null=True,
        blank=True,
    )

    remarks = models.TextField(
        db_column="remarks",
        null=True,
        blank=True,
    )

    b = models.CharField(
        db_column="b",
        max_length=100,
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPolygonField(
        db_column="geom",
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        if self.join_shp:
            return self.join_shp

        if self.khasra_id is not None:
            return str(self.khasra_id)

        return f"Khasra {self.gid}"

    class Meta:
        managed = False
        db_table = "khasra"
    
# --------------------------------------------------------
# Ruda Khasra
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------
class RudaKhasra(models.Model):
    gid = models.AutoField(primary_key=True)

    # Raw text columns from the imported Khasra shapefile.
    # These are intentionally named *_text so they do not conflict with the
    # existing FK attributes named district, tehsil, and mauza.
    district_text = models.CharField(
        db_column="district",
        max_length=100,
        null=True,
        blank=True,
    )

    tehsil_text = models.CharField(
        db_column="tehsil",
        max_length=100,
        null=True,
        blank=True,
    )

    mauza_text = models.CharField(
        db_column="mauza",
        max_length=100,
        null=True,
        blank=True,
    )

    remarks = models.CharField(max_length=100, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)

    district = models.ForeignKey(
        District,
        db_column="dist_id",
        to_field="id",
        related_name="khasras",
        db_constraint=False,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="khasras",
        null=True,
        blank=True,
    )

    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",
        related_name="khasras",
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        null=True,
        blank=True,
    )

    kc = models.CharField(max_length=254, null=True, blank=True)
    kc_id = models.FloatField(null=True, blank=True)

    pc = models.CharField(max_length=100, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)

    hadbust_no = models.IntegerField(null=True, blank=True)
    asse_cir = models.CharField(max_length=100, null=True, blank=True)

    type = models.CharField(max_length=50, null=True, blank=True)

    karam = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        null=True,
        blank=True,
    )

    sq = models.IntegerField(null=True, blank=True)
    kh = models.IntegerField(null=True, blank=True)
    sk = models.CharField(max_length=20, null=True, blank=True)

    join_shp = models.CharField(max_length=50, null=True, blank=True)

    khasra_id = models.FloatField(null=True, blank=True)
    khewat_id = models.FloatField(null=True, blank=True)
    khatoni_no = models.FloatField(null=True, blank=True)

    dc_rate = models.FloatField(null=True, blank=True)
    b = models.CharField(max_length=50, null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.join_shp or str(self.khasra_id) or str(self.gid)

    class Meta:
        managed = False
        db_table = "ruda_khasra"
    
# --------------------------------------------------------
# Trijunction Boundary
# --------------------------------------------------------

class Trijunction(models.Model):
    gid = models.IntegerField(primary_key=True)

    type = models.CharField(max_length=20, null=True, blank=True)

    m1 = models.CharField(max_length=50, null=True, blank=True)
    m1_id = models.FloatField(null=True, blank=True)

    m2 = models.CharField(max_length=50, null=True, blank=True)
    m2_id = models.FloatField(null=True, blank=True)

    m3 = models.CharField(max_length=50, null=True, blank=True)
    m3_id = models.FloatField(null=True, blank=True)

    # FK to Mauza
    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",
        related_name="trijunctions",
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        null=True,
        blank=True,
    )

    layer = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.MultiPointField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Trijunction {self.gid}"

    class Meta:
        managed = False
        db_table = "trijunction"

# --------------------------------------------------------
# Society Administrative Boundary
# --------------------------------------------------------
class Society(models.Model):
    gid = models.AutoField(primary_key=True)

    # These columns exist in your current society table.
    # Do NOT add objectid here unless the database table also has objectid.
    name = models.CharField(max_length=255, null=True, blank=True)
    source = models.CharField(max_length=255, null=True, blank=True)
    feat_count = models.IntegerField(null=True, blank=True)
    area = models.FloatField(null=True, blank=True)
    society = models.CharField(max_length=255, null=True, blank=True)
    society_id = models.IntegerField(null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    dist_id = models.IntegerField(null=True, blank=True)
    tehsil = models.CharField(max_length=100, null=True, blank=True)
    tehsil_id = models.IntegerField(null=True, blank=True)

    mauza = models.CharField(max_length=100, null=True, blank=True)
    mauza_id = models.IntegerField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.society or self.name or f"Society {self.gid}"

    class Meta:
        managed = False
        db_table = "society"

# =========================
# MASTER PLAN
# =========================
class MasterPlan(models.Model):

    gid = models.AutoField(primary_key=True)
    geom = gis_models.GeometryField(srid=4326)
    society_id = models.IntegerField(null=True, blank=True)
    mauza_id = models.IntegerField(null=True, blank=True)
    dist_id = models.IntegerField(null=True, blank=True)
    tehsil_id = models.IntegerField(null=True, blank=True)
    land_use = models.CharField(max_length=100, null=True, blank=True)
    height = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"MasterPlan {self.gid}"

    class Meta:
        managed = False
        db_table = "masterplan"

# =========================
# SPOT LEVEL
# =========================
# class SpotLevel(models.Model):

#     gid = models.AutoField(primary_key=True)
#     geom = gis_models.GeometryField(srid=4326)
#     society_id = models.IntegerField(null=True, blank=True)
#     project_id = models.IntegerField(null=True, blank=True) 
#     mauza_id = models.IntegerField(null=True, blank=True)
#     dist_id = models.IntegerField(null=True, blank=True)
#     tehsil_id = models.IntegerField(null=True, blank=True)

#     def __str__(self):
#         return f"SpotLevel {self.gid}"

#     class Meta:
#         managed = False
#         db_table = "spot_level"

# # =========================
# # CONTOUR
# # =========================

# class Contour(models.Model):

#     gid = models.AutoField(primary_key=True)
#     geom = gis_models.GeometryField(srid=4326)
#     society_id = models.IntegerField(null=True, blank=True)
#     project_id = models.IntegerField(null=True, blank=True) 
#     mauza_id = models.IntegerField(null=True, blank=True)
#     dist_id = models.IntegerField(null=True, blank=True)
#     tehsil_id = models.IntegerField(null=True, blank=True)
#     elevation = models.CharField(max_length=100, null=True, blank=True)
#     def __str__(self):
#         return f"Contour {self.gid}"

#     class Meta:
#         managed = False
#         db_table = "contour"

# =========================
# RUDA PROPOSED ROADS
# =========================

class RudaProposedRoads(models.Model):
    gid = models.AutoField(primary_key=True)

    kml_id = models.CharField(max_length=50, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    kml_desc = models.TextField(null=True, blank=True)

    fid = models.IntegerField(null=True, blank=True)
    entity = models.CharField(max_length=100, null=True, blank=True)
    layer = models.CharField(max_length=100, null=True, blank=True)
    color = models.CharField(max_length=20, null=True, blank=True)
    linetype = models.CharField(max_length=50, null=True, blank=True)

    elevation = models.FloatField(null=True, blank=True)
    linewt = models.FloatField(null=True, blank=True)

    refname = models.CharField(max_length=255, null=True, blank=True)

    geom = gis_models.MultiLineStringField(srid=4326)

    def __str__(self):
        return self.name or f"Road {self.gid}"

    class Meta:
        managed = False
        db_table = "ruda_proposed_roads"

# --------------------------------------------------------
# Ruda Boundary
# --------------------------------------------------------

class RudaBoundary(models.Model):

    gid = models.AutoField(primary_key=True)
    oid = models.FloatField(db_column="oid")
    name = models.CharField(max_length=254, null=True, blank=True)
    folderpath = models.CharField(max_length=254, null=True, blank=True)
    symbolid = models.FloatField(null=True, blank=True)
    altmode = models.IntegerField(null=True, blank=True)
    base = models.FloatField(null=True, blank=True)
    clamped = models.IntegerField(null=True, blank=True)
    extruded = models.IntegerField(null=True, blank=True)
    snippet = models.TextField(null=True, blank=True)
    popupinfo = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.name if self.name else f"RudaBoundary {self.gid}"

    class Meta:
        managed = False
        db_table = "ruda_boundary"


# =========================
# Square
# =========================

class Square(models.Model):
    gid = models.IntegerField(primary_key=True)

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="dist_id",
        related_name="squares",
        null=True,
        blank=True,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="squares",
        null=True,
        blank=True,
    )

    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",     # <-- IMPORTANT
        on_delete=models.DO_NOTHING,
        related_name="squares",
        db_constraint=False,     # because database FK does not exist
        null=True,
        blank=True,
    )

    kc = models.CharField(max_length=254, null=True, blank=True)
    kc_id = models.FloatField(null=True, blank=True)

    pc = models.CharField(max_length=254, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)

    sq = models.FloatField(null=True, blank=True)
    
    layer = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True
    )

    def __str__(self):
        return (
            f"{self.mauza.mauza} - SQ {self.sq}"
            if self.mauza else f"Square {self.gid}"
        )

    class Meta:
        managed = False
        db_table = "square"

# --------------------------------------------------------
# Acre
# District → Tehsil → Mauza → Acre
# --------------------------------------------------------

class Acre(models.Model):
    gid = models.AutoField(primary_key=True)

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="dist_id",
        related_name="acres",
        null=True,
        blank=True,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="acres",
        null=True,
        blank=True,
    )

    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",     # <-- IMPORTANT
        on_delete=models.DO_NOTHING,
        related_name="acres",
        db_constraint=False,     # because database FK does not exist
        null=True,
        blank=True,
    )

    sq = models.FloatField(null=True, blank=True)
    acre = models.FloatField(null=True, blank=True)

    layer = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return (
            f"{self.mauza} - {self.acre} Acre"
            if self.mauza
            else f"Acre {self.gid}"
        )

    class Meta:
        managed = False
        db_table = "acre"

# =========================
# FieldPoints
# =========================
class FieldPoints(models.Model):
    gid = models.IntegerField(primary_key=True)

    name = models.CharField(
        max_length=6,
        null=True,
        blank=True,
    )

    easting = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        null=True,
        blank=True,
    )

    northing = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        null=True,
        blank=True,
    )

    elevation = models.CharField(
        max_length=254,
        null=True,
        blank=True,
    )

    # FK to Mauza
    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",
        on_delete=models.DO_NOTHING,
        related_name="fieldpoints",
        db_constraint=False,
        null=True,
        blank=True,
    )

    layer = models.CharField(
        max_length=254,
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPointField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name if self.name else f"FieldPoint {self.gid}"

    class Meta:
        managed = False
        db_table = "fieldpoints"
        
# =========================
# Geodetic Network
# =========================
class GeodeticNetwork(models.Model):

    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=100, null=True, blank=True)

    # Actual DB columns are easting_(m and northing_(
    # Keep Python/API field names clean as easting_m / northing_m.
    easting_m = models.FloatField(db_column="easting_m", null=True, blank=True)
    northing_m = models.FloatField(db_column="northing_m", null=True, blank=True)

    code = models.CharField(max_length=50, null=True, blank=True)

    elevation = models.FloatField(null=True, blank=True)

    geom = gis_models.PointField(srid=4326)

    def __str__(self):
        return self.name if self.name else f"Geodetic {self.gid}"

    class Meta:
        managed = False
        db_table = "geodeticnetwork"


# =========================
# Project
# =========================
class Project(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)

    type = models.CharField(max_length=100, null=True, blank=True)

    brief_name = models.CharField(max_length=100, null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)

    def __str__(self):
        return self.name or f"Project {self.gid}"

    class Meta:
        managed = False
        db_table = "project"



# =========================
# Project Mauza
# =========================
class ProjectMauza(models.Model):
    id = models.AutoField(primary_key=True)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="project_mauzas"
    )

    mauza = models.ForeignKey(
        Mauza,
        db_column="mauza_id",
        to_field="mauza_id",
        related_name="project_mauzas",
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        null=True,
        blank=True,
    )

    khasra = models.ForeignKey(
        Khasra,
        on_delete=models.CASCADE,
        db_column="khasra_id",
        related_name="project_mauzas",
        null=True,
        blank=True
    )

    square_id = models.FloatField(
        db_column="square_id",
        null=True,
        blank=True
    )

    class Meta:
        managed = True
        db_table = "project_mauza"

    def __str__(self):
        return (
            f"Project={self.project_id}, "
            f"Mauza={self.mauza_id}, "
            f"Khasra={self.khasra_id}"
        )

# =========================
# Block
# =========================

class Block(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)

    area = models.FloatField(null=True, blank=True)

    block = models.CharField(max_length=100, null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="blocks",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.block or self.name or f"Block {self.gid}"

    class Meta:
        managed = False
        db_table = "block"

# =========================
# Block Level
# =========================

class BlockLevel(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)

    block = models.CharField(max_length=255, null=True, blank=True)

    dimension = models.CharField(max_length=255, null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)

    def __str__(self):
        return self.name or f"BlockLevel {self.gid}"

    class Meta:
        managed = False
        db_table = "block_level"
# =========================
# Plot
# =========================
class Plot(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    project = models.ForeignKey(
        Project,
        db_column="project_id",
        to_field="gid",
        on_delete=models.DO_NOTHING,
        related_name="plots",
        null=True,
        blank=True,
    )

    block = models.ForeignKey(
        Block,
        db_column="block_id",
        to_field="gid",
        on_delete=models.DO_NOTHING,
        related_name="plots",
        null=True,
        blank=True,
    )

    plot_no = models.CharField(max_length=100, null=True, blank=True)
    plot_area = models.CharField(max_length=100, null=True, blank=True)

    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)
    dimension = models.CharField(max_length=255, null=True, blank=True)

    parkfront = models.CharField(max_length=50, null=True, blank=True)
    rd_ft = models.CharField(max_length=50, null=True, blank=True)
    storey = models.CharField(max_length=50, null=True, blank=True)
    rd_facing = models.CharField(max_length=50, null=True, blank=True)

    h = models.IntegerField(null=True, blank=True)

    demar = models.CharField(max_length=255, null=True, blank=True)

    possession = models.CharField(max_length=255, null=True, blank=True)
    poss_st = models.CharField(max_length=255, null=True, blank=True)

    canceled = models.CharField(max_length=50, null=True, blank=True)

    site_plan = models.CharField(max_length=255, null=True, blank=True)

    unique_id = models.IntegerField(null=True, blank=True)

    tr_srno = models.IntegerField(null=True, blank=True)
    tr_own = models.TextField(null=True, blank=True)
    tr_p_no = models.CharField(max_length=255, null=True, blank=True)
    tr_cate = models.CharField(max_length=255, null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.plot_no or self.name or f"Plot {self.gid}"

    class Meta:
        managed = False
        db_table = "plot"

# =========================
# Spot Level
# =========================
class SpotLevel(models.Model):
    gid = models.AutoField(primary_key=True)

    geom = gis_models.GeometryField(srid=4326)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="spot_levels",
        null=True,
        blank=True,
    )

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="dist_id",
        related_name="spot_levels",
        null=True,
        blank=True,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="spot_levels",
        null=True,
        blank=True,
    )

    mauza = models.ForeignKey(
        Mauza,
        on_delete=models.CASCADE,
        db_column="mauza_id",
        related_name="spot_levels",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"SpotLevel {self.gid}"

    class Meta:
        managed = False
        db_table = "spot_level"


# =========================
# Contour
# =========================
class Contour(models.Model):
    gid = models.AutoField(primary_key=True)

    geom = gis_models.GeometryField(srid=4326)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="contours",
        null=True,
        blank=True,
    )

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        db_column="dist_id",
        related_name="contours",
        null=True,
        blank=True,
    )

    tehsil = models.ForeignKey(
        Tehsil,
        on_delete=models.CASCADE,
        db_column="tehsil_id",
        related_name="contours",
        null=True,
        blank=True,
    )

    mauza = models.ForeignKey(
        Mauza,
        on_delete=models.CASCADE,
        db_column="mauza_id",
        related_name="contours",
        null=True,
        blank=True,
    )

    elevation = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Contour {self.gid}"

    class Meta:
        managed = False
        db_table = "contour"
# =========================
# Road
# =========================
class Road(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="roads",
        null=True,
        blank=True,
    )

    block = models.ForeignKey(
        Block,
        on_delete=models.CASCADE,
        db_column="block_id",
        related_name="roads",
        null=True,
        blank=True,
    )

    dimension = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    row = models.CharField(max_length=100, null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name or f"Road {self.gid}"

    class Meta:
        managed = False
        db_table = "road"

# =========================
# Camera Location
# =========================
class CameraLocation(models.Model):
    gid = models.AutoField(primary_key=True)

    sr_no = models.IntegerField(
        db_column="sr_no_",
        null=True,
        blank=True,
    )

    project = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    camera = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    # FK
    project_fk = models.ForeignKey(
        Project,
        db_column="project_id",
        to_field="gid",
        on_delete=models.DO_NOTHING,
        related_name="camera_locations",
        db_constraint=False,
        null=True,
        blank=True,
    )

    y = models.FloatField(null=True, blank=True)
    x = models.FloatField(null=True, blank=True)

    coordinate = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    iframe_lin = models.TextField(
        null=True,
        blank=True,
    )

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.camera or f"Camera {self.gid}"

    class Meta:
        managed = False
        db_table = "cameralocation"

# =========================
# SWPoint
# =========================
class SWPoint(models.Model):
    gid = models.AutoField(primary_key=True)

    type = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    project = models.ForeignKey(
        Project,
        db_column="project_id",
        to_field="gid",
        on_delete=models.DO_NOTHING,
        related_name="sw_points",
        db_constraint=False,   # because managed=False table
        null=True,
        blank=True,
    )

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name or f"SWPoint {self.gid}"

    class Meta:
        managed = False
        db_table = "swpoint"

# =========================
# WSL
# =========================
class WSL(models.Model):
    gid = models.AutoField(primary_key=True)

    shape_leng = models.FloatField(
        null=True,
        blank=True
    )

    dia = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    type = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    project = models.ForeignKey(
        Project,
        db_column="project_id",
        to_field="gid",
        on_delete=models.DO_NOTHING,
        related_name="water_supply_lines",
        db_constraint=False,
        null=True,
        blank=True,
    )

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name or f"WSL {self.gid}"

    class Meta:
        managed = False
        db_table = "wsl"

# =========================
# WSPoint
# =========================
class WSPoint(models.Model):
    gid = models.AutoField(primary_key=True)

    type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    project = models.ForeignKey(
        "Project",
        db_column="project_id",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="water_supply_points",
    )

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"WS Point {self.gid}"

    class Meta:
        managed = False
        db_table = "wspoint"

# =========================
# Existing Forest
# =========================
class ExistingForest(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    source = models.CharField(max_length=255, null=True, blank=True)
    lu_type = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)

    area_sqfee = models.FloatField(null=True, blank=True)
    area_acre = models.FloatField(null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Existing Forest {self.gid}"

    class Meta:
        managed = False
        db_table = "existing_forest"
        
# =========================
# RUDA MP Principle Zoning
# =========================
class MpPrincipleZoning(models.Model):
    gid = models.AutoField(primary_key=True)

    area225a = models.FloatField(null=True, blank=True)
    zoning_cat = models.CharField(max_length=255, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.zoning_cat or f"MP Principle Zoning {self.gid}"

    class Meta:
        managed = False
        db_table = "mp_principle_zoning"

# =========================
# City Level Service
# =========================
class CityLevelService(models.Model):
    gid = models.AutoField(primary_key=True)

    layer = models.CharField(max_length=26, null=True, blank=True)
    gm_type = models.CharField(max_length=17, null=True, blank=True)
    elevation = models.SmallIntegerField(null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)
    type = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"City Level Service {self.gid}"

    class Meta:
        managed = False
        db_table = "city_level_service"


# =========================
# Forest Boundary
# =========================
class ForestBoundary(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.FloatField(null=True, blank=True)
    objectid = models.FloatField(null=True, blank=True)
    f_zone = models.CharField(max_length=100, null=True, blank=True)
    f_circle = models.CharField(max_length=100, null=True, blank=True)
    f_div = models.CharField(max_length=100, null=True, blank=True)
    f_name = models.CharField(max_length=100, null=True, blank=True)
    gps_area = models.FloatField(null=True, blank=True)
    gross_area = models.FloatField(null=True, blank=True)
    f_type = models.CharField(max_length=100, null=True, blank=True)
    legal_stat = models.CharField(max_length=50, null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.f_name or f"Forest Boundary {self.gid}"

    class Meta:
        managed = False
        db_table = "forest_boundary"


# =========================
# Precient Boundary
# =========================
class PrecientBoundary(models.Model):
    gid = models.AutoField(primary_key=True)

    area_acre = models.FloatField(null=True, blank=True)
    phases = models.CharField(max_length=100, null=True, blank=True)
    phases_new = models.CharField(max_length=100, null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Precient Boundary {self.gid}"

    class Meta:
        managed = False
        db_table = "precient_boundary"


# =========================
# River
# =========================
class River(models.Model):
    gid = models.AutoField(primary_key=True)

    layer = models.CharField(max_length=17, null=True, blank=True)
    name = models.CharField(max_length=60, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"River {self.gid}"

    class Meta:
        managed = False
        db_table = "river"


# =========================
# River Ravi
# =========================
class RiverRavi(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=254, null=True, blank=True)
    type = models.CharField(max_length=254, null=True, blank=True)
    area = models.FloatField(null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"River Ravi {self.gid}"

    class Meta:
        managed = False
        db_table = "river_ravi"


# =========================
# RUDA Jurisdiction
# =========================
class RudaJurisdiction(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.FloatField(null=True, blank=True)
    area_usacr = models.FloatField(null=True, blank=True)
    phases = models.CharField(max_length=50, null=True, blank=True)
    districts = models.CharField(max_length=50, null=True, blank=True)
    name = models.CharField(max_length=50, null=True, blank=True)
    tehsils = models.CharField(max_length=100, null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"RUDA Jurisdiction {self.gid}"

    class Meta:
        managed = False
        db_table = "ruda_jurisdiction"


# =========================
# City Level Service Points
# =========================
class CityLevelServicePoints(models.Model):
    gid = models.AutoField(primary_key=True)

    layer = models.CharField(max_length=26, null=True, blank=True)
    gm_type = models.CharField(max_length=21, null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)
    type = models.CharField(max_length=254, null=True, blank=True)
    orig_fid = models.FloatField(null=True, blank=True)
    elevation = models.SmallIntegerField(null=True, blank=True)

    geom = gis_models.GeometryField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"City Level Service Point {self.gid}"

    class Meta:
        managed = False
        db_table = "city_level_service_points"

# =========================
# RUDA Planning Boundary
# =========================
class RudaPlanningBoundary(models.Model):
    gid = models.AutoField(primary_key=True)

    area_usacr = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=50, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    area_225ac = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"RUDA Planning Boundary {self.gid}"

    class Meta:
        managed = False
        db_table = "ruda_planning_boundary"


# =========================
# Proposed Road Network
# =========================
class ProposedRoadNetwork(models.Model):
    gid = models.AutoField(primary_key=True)

    gm_layer = models.CharField(max_length=32, null=True, blank=True)
    gm_type = models.CharField(max_length=17, null=True, blank=True)
    elevation = models.SmallIntegerField(null=True, blank=True)
    layer = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.layer or self.gm_layer or f"Proposed Road Network {self.gid}"

    class Meta:
        managed = False
        db_table = "proposed_road_network"

# =================================================================================================
# IMPORTED LAND TABLES
# These models map directly to the existing PostGIS tables. Table names are kept unchanged.
# =================================================================================================

# =========================
# State Land
# DB table: stateland
# =========================
class StateLand(models.Model):
    gid = models.AutoField(primary_key=True)

    district = models.CharField(max_length=254, null=True, blank=True)
    tehsil = models.CharField(max_length=254, null=True, blank=True)
    mouza = models.CharField(max_length=254, null=True, blank=True)

    square = models.SmallIntegerField(null=True, blank=True)
    khasra = models.SmallIntegerField(null=True, blank=True)
    sub_khasra = models.SmallIntegerField(null=True, blank=True)
    khasra_lab = models.CharField(max_length=254, null=True, blank=True)

    remarks = models.CharField(max_length=35, null=True, blank=True)
    state_land = models.CharField(max_length=254, null=True, blank=True)
    area_sqft = models.IntegerField(null=True, blank=True)
    date = models.DateField(db_column="date", null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.khasra_lab or f"StateLand {self.gid}"

    class Meta:
        managed = False
        db_table = "stateland"


# =========================
# RTW Alignment
# DB table: rtwalignment
# =========================
class RtwAlignment(models.Model):
    gid = models.AutoField(primary_key=True)

    package = models.CharField(max_length=254, null=True, blank=True)
    length = models.CharField(max_length=254, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    area_ac225 = models.FloatField(null=True, blank=True)
    date = models.DateField(db_column="date", null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.package or f"RtwAlignment {self.gid}"

    class Meta:
        managed = False
        db_table = "rtwalignment"


# =========================
# Possession Land
# DB table: possessionland
# =========================
class PossessionLand(models.Model):
    gid = models.AutoField(primary_key=True)

    district = models.CharField(max_length=254, null=True, blank=True)
    tehsil = models.CharField(max_length=254, null=True, blank=True)
    mouza = models.CharField(max_length=254, null=True, blank=True)

    square = models.FloatField(null=True, blank=True)
    khasra = models.FloatField(null=True, blank=True)
    khasra_lab = models.CharField(max_length=254, null=True, blank=True)

    award_zone = models.CharField(max_length=254, null=True, blank=True)
    projects = models.CharField(max_length=254, null=True, blank=True)
    l_type = models.CharField(max_length=254, null=True, blank=True)
    land_owner = models.CharField(max_length=254, null=True, blank=True)
    lp_name = models.CharField(max_length=254, null=True, blank=True)
    remarks = models.CharField(max_length=254, null=True, blank=True)
    date = models.CharField(db_column="date", max_length=50, null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.khasra_lab or f"PossessionLand {self.gid}"

    class Meta:
        managed = False
        db_table = "possessionland"


# =========================
# Awarded Land
# DB table: awardedland
# =========================
class AwardedLand(models.Model):
    gid = models.AutoField(primary_key=True)

    district = models.CharField(max_length=254, null=True, blank=True)
    tehsil = models.CharField(max_length=254, null=True, blank=True)
    mouza = models.CharField(max_length=254, null=True, blank=True)

    square = models.FloatField(null=True, blank=True)
    khasra = models.FloatField(null=True, blank=True)
    sub_khasra = models.FloatField(null=True, blank=True)
    khasra_lab = models.CharField(max_length=254, null=True, blank=True)

    agri_river = models.CharField(max_length=254, null=True, blank=True)
    land_type = models.CharField(max_length=254, null=True, blank=True)
    remarks = models.CharField(max_length=254, null=True, blank=True)
    area_sqft = models.FloatField(null=True, blank=True)
    date = models.DateField(db_column="date", null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.khasra_lab or f"AwardedLand {self.gid}"

    class Meta:
        managed = False
        db_table = "awardedland"

# =========================
# RTW Package
# DB table: rtwpackage
# =========================
class RtwPackage(models.Model):
    gid = models.AutoField(primary_key=True)

    layer = models.CharField(max_length=254, null=True, blank=True)
    map_name = models.CharField(max_length=254, null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    package = models.CharField(max_length=254, null=True, blank=True)

    area_acres = models.FloatField(null=True, blank=True)
    closed = models.CharField(max_length=50, null=True, blank=True)
    label_pos = models.CharField(max_length=254, null=True, blank=True)
    ruda_phase = models.CharField(max_length=254, null=True, blank=True)
    area_sqkm = models.FloatField(null=True, blank=True)
    aaa = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.package or self.name or f"RtwPackage {self.date}"

    class Meta:
        managed = False
        db_table = "rtwpackage"

# =========================
# Branch Canal
# DB table: branchcanal
# =========================

class BranchCanal(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(null=True, blank=True)
    objectid = models.IntegerField(null=True, blank=True)
    imis_code = models.CharField(max_length=50, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    parent_ch = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    zone = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="zone_",
    )

    circle = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)

    canal_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="type_",
    )

    gca = models.CharField(max_length=100, null=True, blank=True)
    cca = models.CharField(max_length=100, null=True, blank=True)

    designed_d = models.FloatField(null=True, blank=True)
    tail_rd = models.FloatField(null=True, blank=True)
    a_tail_g = models.FloatField(null=True, blank=True)
    a_tail_d = models.FloatField(null=True, blank=True)

    flow_type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="flow_type_",
    )

    shape_leng = models.FloatField(null=True, blank=True)
    shape_le_1 = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Branch Canal {self.gid}"

    class Meta:
        managed = False
        db_table = "branch_canal"

#----------------------------------------
# Distributary
# DB table: distributary

class Distributary(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(null=True, blank=True)
    objectid = models.IntegerField(null=True, blank=True)
    imis_code = models.CharField(max_length=50, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    parent_ch = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    zone = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="zone_",
    )

    circle = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)

    canal_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="type_",
    )

    gca = models.CharField(max_length=100, null=True, blank=True)
    cca = models.CharField(max_length=100, null=True, blank=True)
    designed_d = models.FloatField(null=True, blank=True)
    tail_rd = models.FloatField(null=True, blank=True)
    a_tail_g = models.FloatField(null=True, blank=True)
    a_tail_d = models.FloatField(null=True, blank=True)

    flow_type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="flow_type_",
    )

    shape_leng = models.FloatField(null=True, blank=True)
    shape_le_1 = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Distributary {self.gid}"

    class Meta:
        managed = False
        db_table = "distributary"

#--------------------------------------------
# Existing Drains
# DB table: existing_drains

class ExistingDrains(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    layer = models.CharField(max_length=255, null=True, blank=True)
    kml_folder = models.CharField(max_length=255, null=True, blank=True)
    length = models.FloatField(null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Existing Drain {self.gid}"

    class Meta:
        managed = False
        db_table = "existing_drains"
    
#--------------------------------------------
# Irrigation Network
# DB table: irrigation_network
class IrrigationNetwork(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(null=True, blank=True)
    objectid = models.IntegerField(null=True, blank=True)
    imis_code = models.CharField(max_length=50, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    parent_ch = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    zone = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="zone_",
    )

    circle = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)

    canal_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="type_",
    )

    gca = models.CharField(max_length=100, null=True, blank=True)
    cca = models.CharField(max_length=100, null=True, blank=True)

    designed_d = models.FloatField(null=True, blank=True)
    tail_rd = models.FloatField(null=True, blank=True)
    a_tail_g = models.FloatField(null=True, blank=True)
    a_tail_d = models.FloatField(null=True, blank=True)

    flow_type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="flow_type_",
    )

    shape_leng = models.FloatField(null=True, blank=True)
    shape_le_1 = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Irrigation Network {self.gid}"

    class Meta:
        managed = False
        db_table = "irrigation_network"

#--------------------------------------------
# Katar Band WWTP
# DB table: katar_band_wwtp
class KatarBandWWTP(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    area = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Katar Band WWTP {self.gid}"

    class Meta:
        managed = False
        db_table = "katar_band_wwtp"

#--------------------------------------------
# Link Canal
# DB table: link_canal
class LinkCanal(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(null=True, blank=True)
    objectid = models.IntegerField(null=True, blank=True)
    imis_code = models.CharField(max_length=50, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    parent_ch = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    zone = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="zone_",
    )

    circle = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)

    canal_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="type_",
    )

    gca = models.CharField(max_length=100, null=True, blank=True)
    cca = models.CharField(max_length=100, null=True, blank=True)

    designed_d = models.FloatField(null=True, blank=True)
    tail_rd = models.FloatField(null=True, blank=True)
    a_tail_g = models.FloatField(null=True, blank=True)
    a_tail_d = models.FloatField(null=True, blank=True)

    flow_type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="flow_type_",
    )

    shape_leng = models.FloatField(null=True, blank=True)
    shape_le_1 = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Link Canal {self.gid}"

    class Meta:
        managed = False
        db_table = "link_canal"

#-------------------------------------------------------
# Proposed WWTP
# DB table: proposed_wwtp
class ProposedWWTP(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    area = models.FloatField(null=True, blank=True)
    descriptio = models.TextField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Proposed WWTP {self.gid}"

    class Meta:
        managed = False
        db_table = "proposed_wwtp"

#-------------------------------------------------------
# SWTP Site
# DB table: swtp_site   
class SWTPSite(models.Model):
    gid = models.AutoField(primary_key=True)

    id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    sq_ft = models.FloatField(null=True, blank=True)
    marla = models.FloatField(null=True, blank=True)
    kanal = models.FloatField(null=True, blank=True)
    acres = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"SWTP Site {self.gid}"

    class Meta:
        managed = False
        db_table = "swtp_site"

#-------------------------------------------------------
# WWTP Sites
# DB table: wwtp_sites
class WWTPSites(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)

    site_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_column="type",
    )

    shape_leng = models.FloatField(null=True, blank=True)
    shape_area = models.FloatField(null=True, blank=True)

    created_us = models.CharField(max_length=255, null=True, blank=True)
    created_da = models.CharField(max_length=255, null=True, blank=True)
    last_edite = models.CharField(max_length=255, null=True, blank=True)
    last_edi_1 = models.CharField(max_length=255, null=True, blank=True)

    area = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"WWTP Site {self.gid}"

    class Meta:
        managed = False
        db_table = "wwtp_sites"


# =========================
# AbdulHakeemMotorwayM3
# DB table: abdulhakeemmotorwaym3
# =========================

class AbdulHakeemMotorwayM3(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    layer = models.CharField(max_length=17, null=True, blank=True)
    kml_style = models.CharField(max_length=15, null=True, blank=True)
    tessellate = models.IntegerField(null=True, blank=True)
    name_1 = models.CharField(max_length=254, null=True, blank=True)
    name_2 = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or self.name_1 or self.name_2 or f"AbdulHakeemMotorwayM3 {self.gid}"

    class Meta:
        managed = False
        db_table = "abdulhakeemmotorwaym3"

# =========================
# HardoSohalMuslimRoad
# DB table: hardosohalmuslimroad
# =========================

class HardoSohalMuslimRoad(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.FloatField(null=True, blank=True)
    row = models.FloatField(null=True, blank=True)
    category = models.CharField(max_length=254, null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    length_km = models.CharField(max_length=254, null=True, blank=True)
    remarks = models.CharField(max_length=254, null=True, blank=True)
    kacha_pacc = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"HardoSohalMuslimRoad {self.gid}"

    class Meta:
        managed = False
        db_table = "hardosohalmuslimroad"

# =========================
# JinnahAvenue
# DB table: jinnahavenue
# =========================

class JinnahAvenue(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.FloatField(null=True, blank=True)
    row = models.FloatField(null=True, blank=True)
    category = models.CharField(max_length=254, null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    length_km = models.CharField(max_length=254, null=True, blank=True)
    remarks = models.CharField(max_length=254, null=True, blank=True)
    kacha_pacc = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"JinnahAvenue {self.gid}"

    class Meta:
        managed = False
        db_table = "jinnahavenue"

# =========================
# kalakhataiinterchange
# DB table: abdulhakeemmotorwaym3
# =========================

class KalaKhataiInterchange(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=12, null=True, blank=True)
    layer = models.CharField(max_length=17, null=True, blank=True)
    kml_style = models.CharField(max_length=15, null=True, blank=True)
    tessellate = models.FloatField(null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"KalaKhataiInterchange {self.gid}"

    class Meta:
        managed = False
        db_table = "kalakhataiinterchange"

# =========================
# AbdulHakeemMotorwayM3
# DB table: abdulhakeemmotorwaym3
# =========================

class KatarBundRoad(models.Model):
    gid = models.AutoField(primary_key=True)

    oid = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    folderpath = models.CharField(max_length=254, null=True, blank=True)
    symbolid = models.FloatField(null=True, blank=True)
    altmode = models.IntegerField(null=True, blank=True)
    base = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)
    clamped = models.IntegerField(null=True, blank=True)
    extruded = models.IntegerField(null=True, blank=True)
    snippet = models.CharField(max_length=254, null=True, blank=True)
    popupinfo = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)
    row = models.CharField(max_length=254, null=True, blank=True)
    buffer = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"KatarBundRoad {self.gid}"

    class Meta:
        managed = False
        db_table = "katarbundroad"

# =========================
# AbdulHakeemMotorwayM3
# DB table: abdulhakeemmotorwaym3
# =========================

class LahoreBypass(models.Model):
    gid = models.AutoField(primary_key=True)

    oid = models.FloatField(null=True, blank=True)
    name = models.CharField(max_length=254, null=True, blank=True)
    folderpath = models.CharField(max_length=254, null=True, blank=True)
    symbolid = models.FloatField(null=True, blank=True)
    altmode = models.IntegerField(null=True, blank=True)
    base = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)
    clamped = models.IntegerField(null=True, blank=True)
    extruded = models.IntegerField(null=True, blank=True)
    snippet = models.CharField(max_length=254, null=True, blank=True)
    popupinfo = models.CharField(max_length=254, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"LahoreBypass {self.gid}"

    class Meta:
        managed = False
        db_table = "lahorebypass"

# =========================
# AbdulHakeemMotorwayM3
# DB table: abdulhakeemmotorwaym3
# =========================

class SialkotMotorway(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.FloatField(null=True, blank=True)
    objectid = models.FloatField(null=True, blank=True)
    label = models.CharField(max_length=150, null=True, blank=True)
    length_km = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.label or f"SialkotMotorway {self.gid}"

    class Meta:
        managed = False
        db_table = "sialkotmotorway"

# =========================
# AbdulHakeemMotorwayM3
# DB table: abdulhakeemmotorwaym3
# =========================

class TransportationRoads(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.FloatField(null=True, blank=True)
    objectid = models.FloatField(null=True, blank=True)
    type = models.CharField(max_length=22, null=True, blank=True)
    name = models.CharField(max_length=63, null=True, blank=True)
    shape_leng = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)
    shape_le_1 = models.DecimalField(max_digits=30, decimal_places=12, null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or self.type or f"TransportationRoads {self.gid}"

    class Meta:
        managed = False
        db_table = "transportationroads"

#--------------------------------------------------
# LahoreRingRoad
# DB table: lahoreringroad

class LahoreRingRoad(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(null=True, blank=True)
    objectid = models.IntegerField(null=True, blank=True)
    fid = models.IntegerField(
        db_column="fid_",
        null=True,
        blank=True,
    )

    entity_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="entity",
    )

    layer = models.CharField(max_length=255, null=True, blank=True)
    color = models.IntegerField(null=True, blank=True)
    linetype = models.CharField(max_length=255, null=True, blank=True)
    elevation = models.FloatField(null=True, blank=True)
    linewt = models.IntegerField(null=True, blank=True)
    refname = models.CharField(max_length=255, null=True, blank=True)
    orig_fid = models.IntegerField(null=True, blank=True)
    shape_leng = models.FloatField(null=True, blank=True)
    shape_le_1 = models.FloatField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.refname or f"Lahore Ring Road {self.gid}"

    class Meta:
        managed = False
        db_table = "lahoreringroad"

#--------------------------------------------
# Bridges 
#--------------------------------------------
class Bridges(models.Model):
    gid = models.AutoField(primary_key=True)

    osm_id = models.BigIntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    ref = models.CharField(max_length=255, null=True, blank=True)

    bridge_type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="type",
    )

    oneway = models.IntegerField(null=True, blank=True)
    bridge = models.IntegerField(null=True, blank=True)
    maxspeed = models.IntegerField(null=True, blank=True)

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Bridge {self.gid}"

    class Meta:
        managed = False
        db_table = "bridges"

#--------------------------------------------
# GanjaKalanTruckStand
#--------------------------------------------
class GanjaKalanTruckStand(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField(null=True, blank=True)

    district = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    tehsil = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    mouza = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    square = models.IntegerField(
        null=True,
        blank=True,
    )

    khasra = models.IntegerField(
        null=True,
        blank=True,
    )

    sub_khasra = models.IntegerField(
        null=True,
        blank=True,
    )

    khasra_lab = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    remarks = models.TextField(
        null=True,
        blank=True,
    )

    area_sqft = models.FloatField(
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    shape_area = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.mouza or f"Ganja Kalan Truck Stand {self.gid}"

    class Meta:
        managed = False
        db_table = "ganjakalantruckstand"


#--------------------------------------------
# LahoreRapidMassTransit
#--------------------------------------------
class LahoreRapidMassTransit(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Lahore Rapid Mass Transit {self.gid}"

    class Meta:
        managed = False
        db_table = "lahorerapidmasstransit"


#--------------------------------------------
# OrangeTrack
#--------------------------------------------
class OrangeTrack(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    folderpath = models.CharField(
        max_length=500,
        null=True,
        blank=True,
    )

    symbolid = models.IntegerField(
        null=True,
        blank=True,
    )

    altmode = models.IntegerField(
        null=True,
        blank=True,
    )

    base = models.FloatField(
        null=True,
        blank=True,
    )

    clamped = models.IntegerField(
        null=True,
        blank=True,
    )

    extruded = models.IntegerField(
        null=True,
        blank=True,
    )

    snippet = models.TextField(
        null=True,
        blank=True,
    )

    popupinfo = models.TextField(
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Orange Track {self.gid}"

    class Meta:
        managed = False
        db_table = "orangetrack"

#--------------------------------------------
# Railway Line
#--------------------------------------------

class RailwayLine(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid_1 = models.IntegerField(
        null=True,
        blank=True,
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    shape_le_1 = models.FloatField(
        null=True,
        blank=True,
    )

    shape_le_2 = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Railway Line {self.gid}"

    class Meta:
        managed = False
        db_table = "railwayline"

#--------------------------------------------
# Railway Stations
#--------------------------------------------
class RailwayStations(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField(
        null=True,
        blank=True,
    )

    fid = models.IntegerField(
        db_column="fid_",
        null=True,
        blank=True,
    )

    entity = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    layer = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    color = models.IntegerField(
        null=True,
        blank=True,
    )

    linetype = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    elevation = models.FloatField(
        null=True,
        blank=True,
    )

    linewt = models.IntegerField(
        null=True,
        blank=True,
    )

    refname = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    shape_area = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.layer or f"Railway Station {self.gid}"

    class Meta:
        managed = False
        db_table = "railwaystations"

#----------------------------------------------
# Hudiara Drain
#----------------------------------------------
class HudiaraDrain(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField(
        null=True,
        blank=True,
    )

    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    layer = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    drain = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    shape_leng = models.FloatField(
        null=True,
        blank=True,
    )

    geom = gis_models.MultiLineStringField(
        srid=4326,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name or f"Hudiara Drain {self.gid}"

    class Meta:
        managed = False
        db_table = "hudiaradrain"