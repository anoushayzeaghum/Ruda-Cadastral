from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListLahoreRingRoadView(viewsets.ViewSet):
    queryset = LahoreRingRoad.objects.all()
    serializer_class = LahoreRingRoadSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "entity_name",
        "layer",
        "color",
        "linetype",
        "refname",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = LahoreRingRoad.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Lahore Ring Road not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = LahoreRingRoadSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Lahore Ring Road found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = LahoreRingRoad.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = LahoreRingRoadSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Lahore Ring Road records found.",
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

    @action(detail=True, methods=["get"], url_path="geojson", url_name="geojson")
    def geojson(self, request, pk=None):
        try:
            record = LahoreRingRoad.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Lahore Ring Road not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = LahoreRingRoadSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Lahore Ring Road GeoJSON found.",
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