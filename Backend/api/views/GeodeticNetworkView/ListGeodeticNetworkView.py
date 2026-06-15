from ..common_imports import *
from rest_framework.decorators import action


class ListGeodeticNetworkView(viewsets.ViewSet):
    queryset = GeodeticNetwork.objects.all()
    serializer_class = GeodeticNetworkSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            code = request.query_params.get("code")
            name = request.query_params.get("name")

            if gid:
                obj = GeodeticNetwork.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="GeodeticNetwork not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="GeodeticNetwork found.",
                    data=GeodeticNetworkSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = GeodeticNetwork.objects.all()

            if code:
                queryset = queryset.filter(code__iexact=code)

            if name:
                queryset = queryset.filter(name__iexact=name)

            serializer = GeodeticNetworkSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeodeticNetwork list fetched successfully.",
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
            obj = GeodeticNetwork.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="GeodeticNetwork not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=GeodeticNetworkSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()