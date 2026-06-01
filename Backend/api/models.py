from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.auth.base_user import AbstractBaseUser,BaseUserManager
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import datetime
import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin
)
# --------------------------------------------------------
# Division Administrative Boundary
# --------------------------------------------------------

from django.db import models
from django.contrib.gis.db import models as gis_models

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

        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(
            email,
            company_name,
            password,
            **extra_fields
        )


# --------------------------------------------------------
# Custom User Model
# --------------------------------------------------------

class MyUser(AbstractBaseUser,PermissionsMixin):

    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(max_length=255, unique=True)

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='super_admin'
    )


    country = models.CharField(max_length=200, null=True, blank=True)
    address = models.CharField(max_length=400, null=True, blank=True)
    city = models.CharField(max_length=200, null=True, blank=True)
    zipcode = models.CharField(max_length=200, null=True, blank=True)
    contact = models.CharField(max_length=20, blank=True, null=True)

    # 🔐 Required Django Permission Fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)

    objects = MyUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['company_name']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

User = get_user_model()


class Division(models.Model):

    gid = models.AutoField(primary_key=True)
    division = models.CharField(max_length=50)
    division_i = models.FloatField()
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.division

    class Meta:
        managed = False
        db_table = "division"

# --------------------------------------------------------
# District Administrative Boundary
# --------------------------------------------------------

class District(models.Model):

    gid = models.AutoField(primary_key=True)
    objectid = models.FloatField()
    id = models.FloatField()
    name = models.CharField(max_length=50)
    division = models.CharField(max_length=50)
    division_i = models.FloatField()
    extent = models.CharField(max_length=100, null=True, blank=True)
    shape_star = models.FloatField(null=True, blank=True)
    shape_stle = models.FloatField(null=True, blank=True)
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return f"{self.name} ({self.division})"

    class Meta:
        managed = False
        db_table = "district"


# --------------------------------------------------------
# Tehsil Administrative Boundary
# --------------------------------------------------------

class Tehsil(models.Model):

    gid = models.AutoField(primary_key=True)
    objectid = models.IntegerField()
    id = models.FloatField()
    name = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    district_i = models.IntegerField()
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
# Mouza Administrative Boundary
# --------------------------------------------------------

class Mouza(models.Model):

    gid = models.AutoField(primary_key=True)
    district = models.CharField(max_length=100)
    dist_id = models.FloatField()
    tehsil = models.CharField(max_length=100)
    tehsil_id = models.FloatField()
    qh = models.CharField(max_length=100, null=True, blank=True)
    qh_id = models.IntegerField(null=True, blank=True)
    pc = models.CharField(max_length=100, null=True, blank=True)
    pc_id = models.IntegerField(null=True, blank=True)
    mouza = models.CharField(max_length=100)
    mouza_id = models.FloatField()
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.mouza

    class Meta:
        managed = False
        db_table = "mouza"


# --------------------------------------------------------
# Murabba Administrative Boundary
# --------------------------------------------------------

class Murabba(models.Model):

    gid = models.AutoField(primary_key=True)
    district = models.CharField(max_length=50)
    dist_id = models.FloatField()
    tehsil = models.CharField(max_length=50)
    tehsil_id = models.FloatField()
    qh = models.CharField(max_length=50, null=True, blank=True)
    qh_id = models.FloatField(null=True, blank=True)
    pc = models.CharField(max_length=50, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)
    mouza = models.CharField(max_length=50)
    mouza_id = models.FloatField()
    murabba_no = models.IntegerField(db_column="m")
    sheets = models.CharField(max_length=50)
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return f"{self.mouza} - Murabba {self.murabba_no}"

    class Meta:
        managed = False
        db_table = "murabba"


# --------------------------------------------------------
# Khasra Administrative Boundary
# --------------------------------------------------------

class Khasra(models.Model):

    gid = models.AutoField(primary_key=True)
    district = models.CharField(max_length=50)
    dist_id = models.FloatField()
    tehsil = models.CharField(max_length=50)
    tehsil_id = models.FloatField()
    qh = models.CharField(max_length=254, null=True, blank=True)
    qh_id = models.FloatField(null=True, blank=True)
    pc = models.CharField(max_length=50, null=True, blank=True)
    pc_id = models.FloatField(null=True, blank=True)
    mouza = models.CharField(max_length=50)
    mouza_id = models.FloatField()
    type = models.CharField(max_length=50)
    m = models.IntegerField()
    a = models.IntegerField()
    k = models.IntegerField()
    sk = models.CharField(max_length=20, null=True, blank=True)
    khasra_id = models.FloatField()
    label = models.CharField(max_length=25)
    join_shp = models.CharField(max_length=50, null=True, blank=True)
    karam = models.DecimalField(max_digits=20, decimal_places=10)
    remarks = models.CharField(max_length=50, null=True, blank=True)
    b = models.CharField(max_length=50)
    mn = models.IntegerField()
    division = models.CharField(max_length=50)
    khewat_id = models.FloatField()
    divn_id = models.FloatField()
    geom = gis_models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.label

    class Meta:
        managed = False
        db_table = "khasra"

# --------------------------------------------------------
# Khasra Administrative Boundary
# --------------------------------------------------------
        
class RudaBoundary(models.Model):
    gid = models.AutoField(primary_key=True)
    oid = models.FloatField(db_column='oid')
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