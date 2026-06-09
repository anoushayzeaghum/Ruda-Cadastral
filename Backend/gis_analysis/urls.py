from django.urls import path
from .views import (
    BufferAnalysisView,
    ProximityAnalysisView,
    NearestFacilityView,
    SuitabilityAnalysisView,
)

urlpatterns = [
    path("buffer/", BufferAnalysisView.as_view(), name="gis-buffer"),
    path("proximity/", ProximityAnalysisView.as_view(), name="gis-proximity"),
    path("nearest/", NearestFacilityView.as_view(), name="gis-nearest"),
    path("suitability/", SuitabilityAnalysisView.as_view(), name="gis-suitability"),
]
