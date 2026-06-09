from django.urls import path
from .views import AmenityListView

urlpatterns = [
    path("", AmenityListView.as_view(), name="amenity-list"),
]
