from ...common_imports import *
from rest_framework.decorators import action


class ListBlockLevelView(viewsets.ViewSet):
    queryset = BlockLevel.objects.all()
    serializer_class = BlockLevelSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            block = request.query_params.get("block")
            dimension = request.query_params.get("dimension")

            if gid:
                obj = BlockLevel.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="BlockLevel not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="BlockLevel found.",
                    data=BlockLevelSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = BlockLevel.objects.all()

            if name:
                queryset = queryset.filter(name__icontains=name)

            if block:
                queryset = queryset.filter(block__icontains=block)

            if dimension:
                queryset = queryset.filter(dimension__icontains=dimension)

            serializer = BlockLevelSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="BlockLevel list fetched successfully.",
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
            obj = BlockLevel.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="BlockLevel not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=BlockLevelSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()