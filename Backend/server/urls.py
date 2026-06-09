from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("api/amenities/", include("amenities.urls")),
    path("api/gis-analysis/", include("gis_analysis.urls")),
]
