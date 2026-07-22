from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListKatarBundRoadView(viewsets.ViewSet):
    queryset = KatarBundRoad.objects.all()
    serializer_class = KatarBundRoadSerializer
    permission_classes = [AllowAny]
    filter_fields = ['oid', 'name', 'folderpath', 'symbolid', 'altmode', 'clamped', 'extruded', 'row', 'buffer']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = KatarBundRoad.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="KatarBundRoad not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="KatarBundRoad found.",
                    data=KatarBundRoadSerializer(record).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = KatarBundRoad.objects.all()
            if filters:
                queryset = queryset.filter(**filters)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KatarBundRoad records found.",
                data=KatarBundRoadSerializer(queryset, many=True).data,
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
            record = KatarBundRoad.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="KatarBundRoad not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KatarBundRoad GeoJSON found.",
                data=KatarBundRoadSerializer(record).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
