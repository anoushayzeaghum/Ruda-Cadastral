from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListCityLevelServicePointsView(viewsets.ViewSet):
    queryset = CityLevelServicePoints.objects.all()
    serializer_class = CityLevelServicePointsSerializer
    permission_classes = [AllowAny]
    filter_fields = ['layer', 'gm_type', 'name', 'area_225ac', 'type', 'orig_fid', 'elevation']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = CityLevelServicePoints.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="CityLevelServicePoints not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = CityLevelServicePointsSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="CityLevelServicePoints found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = CityLevelServicePoints.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = CityLevelServicePointsSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CityLevelServicePoints records found.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):
        try:
            record = CityLevelServicePoints.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="CityLevelServicePoints not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = CityLevelServicePointsSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CityLevelServicePoints GeoJSON found.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
