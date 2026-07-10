from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListCityLevelServiceView(viewsets.ViewSet):
    queryset = CityLevelService.objects.all()
    serializer_class = CityLevelServiceSerializer
    permission_classes = [AllowAny]
    filter_fields = ['layer', 'gm_type', 'elevation', 'name', 'area_225ac', 'type']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = CityLevelService.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="CityLevelService not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = CityLevelServiceSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="CityLevelService found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = CityLevelService.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = CityLevelServiceSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CityLevelService records found.",
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
            record = CityLevelService.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="CityLevelService not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = CityLevelServiceSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CityLevelService GeoJSON found.",
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
