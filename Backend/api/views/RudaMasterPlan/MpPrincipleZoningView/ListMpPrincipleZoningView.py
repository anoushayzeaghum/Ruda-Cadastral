from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListMpPrincipleZoningView(viewsets.ViewSet):
    queryset = MpPrincipleZoning.objects.all()
    serializer_class = MpPrincipleZoningSerializer
    permission_classes = [AllowAny]
    filter_fields = ['area225a', 'zoning_cat', 'area_sqft']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = MpPrincipleZoning.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="MpPrincipleZoning not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MpPrincipleZoningSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="MpPrincipleZoning found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = MpPrincipleZoning.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = MpPrincipleZoningSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MpPrincipleZoning records found.",
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
            record = MpPrincipleZoning.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="MpPrincipleZoning not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = MpPrincipleZoningSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MpPrincipleZoning GeoJSON found.",
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
