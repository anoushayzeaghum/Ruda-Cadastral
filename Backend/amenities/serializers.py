from rest_framework import serializers
from .models import Amenity


class AmenitySerializer(serializers.ModelSerializer):
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()

    class Meta:
        model = Amenity
        fields = ["id", "name", "category", "source", "source_id", "is_verified", "longitude", "latitude"]

    def get_longitude(self, obj):
        return obj.geom.x

    def get_latitude(self, obj):
        return obj.geom.y
