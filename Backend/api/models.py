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

class District(models.Model):

    gid = models.AutoField(primary_key=True)
    objectid = models.FloatField(null=True, blank=True)
    id = models.FloatField()
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
# Tehsil Administrative Boundary
# District → Tehsil
# --------------------------------------------------------

class Tehsil(models.Model):

    gid = models.AutoField(primary_key=True)
    objectid = models.IntegerField(null=True, blank=True)
    id = models.FloatField()
    name = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    district_i = models.IntegerField(null=True, blank=True)
    extent = models.CharField(max_length=100, null=True, blank=True)
    shape_star = models.FloatField(null=True, blank=True)
    shape_stle = models.FloatField(null=True, blank=True)
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return f"{self.name} ({self.district})"

    class Meta:
        managed = False
        db_table = "tehsil"


# --------------------------------------------------------
# Mauza Administrative Boundary
# District → Tehsil → Mauza
# --------------------------------------------------------

class Mauza(models.Model):

    gid = models.AutoField(primary_key=True)

    district = models.CharField(max_length=100)
    dist_id = models.FloatField()

    tehsil = models.CharField(max_length=100)
    tehsil_id = models.FloatField()

    kc = models.CharField(max_length=100, null=True, blank=True)
    kc_id = models.IntegerField(null=True, blank=True)

    pc = models.CharField(max_length=100, null=True, blank=True)
    pc_id = models.IntegerField(null=True, blank=True)

    mauza = models.CharField(max_length=100)
    mauza_id = models.FloatField()

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.mauza

    class Meta:
        managed = False
        db_table = "mauza"


# --------------------------------------------------------
# Murabba Administrative Boundary
# District → Tehsil → Mauza → Murabba
# --------------------------------------------------------

class Murabba(models.Model):

    gid = models.AutoField(primary_key=True)

    district = models.CharField(max_length=50)
    dist_id = models.FloatField()

    tehsil = models.CharField(max_length=50)
    tehsil_id = models.FloatField()

    kc = models.CharField(max_length=50, null=True, blank=True)
    kc_id = models.FloatField(null=True, blank=True)

    pc = models.CharField(max_length=50, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)

    mauza = models.CharField(max_length=50)
    mauza_id = models.FloatField()

    murabba_no = models.IntegerField(db_column="m")
    sheets = models.CharField(max_length=50)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return f"{self.mauza} - Murabba {self.murabba_no}"

    class Meta:
        managed = False
        db_table = "murabba"


# --------------------------------------------------------
# Khasra Administrative Boundary - New Format
# District → Tehsil → Mauza → Khasra
# --------------------------------------------------------

class Khasra(models.Model):

    gid = models.AutoField(primary_key=True)

    join_shp = models.CharField(max_length=50, null=True, blank=True)

    district = models.CharField(max_length=50, null=True, blank=True)
    dist_id = models.FloatField(null=True, blank=True)

    tehsil = models.CharField(max_length=50, null=True, blank=True)
    tehsil_id = models.FloatField(null=True, blank=True)

    kc = models.CharField(max_length=254, null=True, blank=True)
    kc_id = models.FloatField(null=True, blank=True)

    pc = models.CharField(max_length=100, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)

    mauza = models.CharField(max_length=100, null=True, blank=True)
    mauza_id = models.FloatField(null=True, blank=True)

    hadbust_no = models.IntegerField(null=True, blank=True)
    asse_cir = models.CharField(max_length=100, null=True, blank=True)

    karam = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        null=True,
        blank=True
    )

    type = models.CharField(max_length=50, null=True, blank=True)

    sq = models.IntegerField(null=True, blank=True)
    kh = models.IntegerField(null=True, blank=True)
    sk = models.CharField(max_length=20, null=True, blank=True)

    khasra_id = models.FloatField(null=True, blank=True)
    khewat_id = models.FloatField(null=True, blank=True)
    khatoni_no = models.FloatField(null=True, blank=True)

    dc_rate = models.FloatField(null=True, blank=True)
    remarks = models.CharField(max_length=100, null=True, blank=True)

    b = models.CharField(max_length=50, null=True, blank=True)

    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.join_shp or str(self.khasra_id) or str(self.gid)

    class Meta:
        managed = False
        db_table = "khasra"

# --------------------------------------------------------
# Society Administrative Boundary
# --------------------------------------------------------
class Society(models.Model):
    gid = models.AutoField(primary_key=True)

    objectid = models.IntegerField()

    society = models.CharField(max_length=255)
    society_id = models.IntegerField()
    
    district = models.CharField(max_length=100)
    dist_id = models.IntegerField()

    tehsil = models.CharField(max_length=100)
    tehsil_id = models.IntegerField()

    mauza = models.CharField(max_length=100)
    mauza_id = models.IntegerField()

    geom = gis_models.MultiPolygonField(srid=4326)

    class Meta:
        managed = False
        db_table = "society"

# =========================
# MASTER PLAN
# =========================
class MasterPlan(models.Model):
    gid = models.AutoField(primary_key=True)
    id = models.CharField(max_length=100, null=True, blank=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    descriptio = models.TextField(null=True, blank=True)

    timestamp = models.CharField(max_length=100, null=True, blank=True)
    begin = models.CharField(max_length=100, null=True, blank=True)
    end = models.CharField(max_length=100, null=True, blank=True)

    altitudemo = models.CharField(max_length=50, null=True, blank=True)
    tessellate = models.CharField(max_length=50, null=True, blank=True)
    extrude = models.CharField(max_length=50, null=True, blank=True)
    visibility = models.CharField(max_length=50, null=True, blank=True)
    draworder = models.CharField(max_length=50, null=True, blank=True)
    icon = models.CharField(max_length=255, null=True, blank=True)
    snippet = models.TextField(null=True, blank=True)

    geom = gis_models.GeometryField(srid=4326)

    society_id = models.IntegerField(null=True, blank=True)
    mauza_id = models.IntegerField(null=True, blank=True)
    dist_id = models.IntegerField(null=True, blank=True)
    tehsil_id = models.IntegerField(null=True, blank=True)

    society = models.CharField(max_length=100, null=True, blank=True)
    mauza = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    tehsil = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "masterplan"


# =========================
# SPOT LEVEL
# =========================
class SpotLevel(models.Model):
    gid = models.AutoField(primary_key=True)
    id = models.IntegerField(null=True, blank=True)

    geom = gis_models.GeometryField(srid=4326)

    society_id = models.IntegerField(null=True, blank=True)
    mauza_id = models.IntegerField(null=True, blank=True)
    dist_id = models.IntegerField(null=True, blank=True)
    tehsil_id = models.IntegerField(null=True, blank=True)

    society = models.CharField(max_length=100, null=True, blank=True)
    mauza = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    tehsil = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "spot_level"


# =========================
# CONTOUR
# =========================
class Contour(models.Model):
    gid = models.AutoField(primary_key=True)

    name = models.CharField(max_length=255, null=True, blank=True)
    layer = models.CharField(max_length=255, null=True, blank=True)
    elevation = models.CharField(max_length=50, null=True, blank=True)
    closed_con = models.CharField(max_length=10, null=True, blank=True)

    geom = gis_models.GeometryField(srid=4326)

    society_id = models.IntegerField(null=True, blank=True)
    mauza_id = models.IntegerField(null=True, blank=True)
    dist_id = models.IntegerField(null=True, blank=True)
    tehsil_id = models.IntegerField(null=True, blank=True)

    society = models.CharField(max_length=100, null=True, blank=True)
    mauza = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    tehsil = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "contour"



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


# --------------------------------------------------------
# Trijunction Boundary
# --------------------------------------------------------

class Trijunction(models.Model):

    gid = models.AutoField(primary_key=True)

    type = models.CharField(max_length=20, null=True, blank=True)

    m1 = models.CharField(max_length=50, null=True, blank=True)
    m1_id = models.FloatField(null=True, blank=True)

    m2 = models.CharField(max_length=50, null=True, blank=True)
    m2_id = models.FloatField(null=True, blank=True)

    m3 = models.CharField(max_length=50, null=True, blank=True)
    m3_id = models.FloatField(null=True, blank=True)

    layer = models.CharField(max_length=254, null=True, blank=True)
    path = models.CharField(max_length=254, null=True, blank=True)

    geom = gis_models.GeometryField(srid=4326)

    def __str__(self):
        names = [self.m1, self.m2, self.m3]
        names = [n for n in names if n]
        return " - ".join(names) if names else f"Trijunction {self.gid}"

    class Meta:
        managed = False
        db_table = "trijunction"