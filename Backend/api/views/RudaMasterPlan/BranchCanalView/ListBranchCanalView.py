from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListBranchCanalView(viewsets.ViewSet):
    queryset = BranchCanal.objects.all()
    serializer_class = BranchCanalSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "division",
        "parent_ch",
        "zone",
        "circle",
        "name",
        "canal_type",
        "flow_type",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = BranchCanal.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Branch Canal not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = BranchCanalSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Branch Canal found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)

                if value not in [None, ""]:
                    filters[field] = value

            queryset = BranchCanal.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = BranchCanalSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Branch Canal records found.",
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
            record = BranchCanal.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Branch Canal not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = BranchCanalSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Branch Canal GeoJSON found.",
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