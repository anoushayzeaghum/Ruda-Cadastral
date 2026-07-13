from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListKalaKhataJiInterchangeView(viewsets.ViewSet):
    queryset = KalaKhataJiInterchange.objects.all()
    serializer_class = KalaKhataJiInterchangeSerializer
    permission_classes = [AllowAny]
    filter_fields = ['objectid', 'name', 'layer', 'kml_style', 'tessellate']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = KalaKhataJiInterchange.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="KalaKhataJiInterchange not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="KalaKhataJiInterchange found.",
                    data=KalaKhataJiInterchangeSerializer(record).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = KalaKhataJiInterchange.objects.all()
            if filters:
                queryset = queryset.filter(**filters)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KalaKhataJiInterchange records found.",
                data=KalaKhataJiInterchangeSerializer(queryset, many=True).data,
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
            record = KalaKhataJiInterchange.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="KalaKhataJiInterchange not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KalaKhataJiInterchange GeoJSON found.",
                data=KalaKhataJiInterchangeSerializer(record).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
