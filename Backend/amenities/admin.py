from django.contrib import admin
from .models import Amenity


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "source", "is_active", "is_verified", "updated_at")
    list_filter = ("category", "source", "is_active", "is_verified")
    search_fields = ("name", "source_id")
    list_per_page = 50
