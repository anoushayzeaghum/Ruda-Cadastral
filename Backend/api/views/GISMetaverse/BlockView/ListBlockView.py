from ...common_imports import *
from rest_framework.decorators import action


class ListBlockView(viewsets.ViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            block = request.query_params.get("block")

            if gid:
                obj = Block.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Block not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Block found.",
                    data=BlockSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Block.objects.all()

            if name:
                queryset = queryset.filter(name__icontains=name)

            if block:
                queryset = queryset.filter(block__iexact=block)

            serializer = BlockSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Block list fetched successfully.",
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
            obj = Block.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Block not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=BlockSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()