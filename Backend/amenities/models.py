from django.contrib.gis.db import models
from django.contrib.postgres.indexes import GistIndex


class Amenity(models.Model):
    CATEGORY_CHOICES = [
        ("hospital", "Hospital"),
        ("school", "School"),
        ("park", "Park"),
        ("mosque", "Mosque"),
        ("transport", "Transport"),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    geom = models.PointField(srid=4326)
    source = models.CharField(max_length=50, default="osm")
    source_id = models.CharField(max_length=150, unique=True)
    properties = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["category"]),
            GistIndex(fields=["geom"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.category})"
