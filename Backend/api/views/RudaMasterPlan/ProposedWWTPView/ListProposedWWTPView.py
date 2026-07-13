from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListProposedWWTPView(viewsets.ViewSet):
    queryset = ProposedWWTP.objects.all()
    serializer_class = ProposedWWTPSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "name",
        "area",
        "descriptio",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid:
                record = ProposedWWTP.objects.filter(gid=gid).first()

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="ProposedWWTP not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = ProposedWWTPSerializer(record)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ProposedWWTP found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)

                if value not in [None, ""]:
                    filters[field] = value

            queryset = ProposedWWTP.objects.all()

            if filters:
                queryset = queryset.filter(**filters)

            serializer = ProposedWWTPSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ProposedWWTP records found.",
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
            record = ProposedWWTP.objects.filter(gid=pk).first()

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="ProposedWWTP not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = ProposedWWTPSerializer(record)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ProposedWWTP GeoJSON found.",
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