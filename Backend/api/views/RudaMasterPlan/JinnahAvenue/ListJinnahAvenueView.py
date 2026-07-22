from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListJinnahAvenueView(viewsets.ViewSet):
    queryset = JinnahAvenue.objects.all()
    serializer_class = JinnahAvenueSerializer
    permission_classes = [AllowAny]
    filter_fields = ['objectid', 'row', 'category', 'name', 'length_km', 'remarks', 'kacha_pacc']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = JinnahAvenue.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="JinnahAvenue not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="JinnahAvenue found.",
                    data=JinnahAvenueSerializer(record).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = JinnahAvenue.objects.all()
            if filters:
                queryset = queryset.filter(**filters)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="JinnahAvenue records found.",
                data=JinnahAvenueSerializer(queryset, many=True).data,
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
            record = JinnahAvenue.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="JinnahAvenue not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="JinnahAvenue GeoJSON found.",
                data=JinnahAvenueSerializer(record).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
