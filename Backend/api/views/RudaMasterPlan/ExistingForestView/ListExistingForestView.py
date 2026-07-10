from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListExistingForestView(viewsets.ViewSet):
    queryset = ExistingForest.objects.all()
    serializer_class = ExistingForestSerializer
    permission_classes = [AllowAny]
    filter_fields = ['name', 'type', 'source', 'lu_type', 'status', 'comments', 'area_sqfee', 'area_acre', 'area_225ac']

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = ExistingForest.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="ExistingForest not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = ExistingForestSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ExistingForest found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = ExistingForest.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = ExistingForestSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ExistingForest records found.",
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
            record = ExistingForest.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="ExistingForest not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = ExistingForestSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ExistingForest GeoJSON found.",
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
