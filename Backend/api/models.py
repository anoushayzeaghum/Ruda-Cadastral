from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import datetime
import uuid

# --------------------------------------------------------
# Division Administrative Boundary
# --------------------------------------------------------

from django.db import models
from django.contrib.gis.db import models as gis_models


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
    oid = models.FloatField(db_column='oid_')
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