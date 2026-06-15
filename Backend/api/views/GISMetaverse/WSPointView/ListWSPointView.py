from ...common_imports import *
from rest_framework.decorators import action


class ListWSPointView(viewsets.ViewSet):
    queryset = WSPoint.objects.all()
    serializer_class = WSPointSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            type_val = request.query_params.get("type")
            name = request.query_params.get("name")

            if gid:
                obj = WSPoint.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="WS Point Feature not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="WS Point Feature found.",
                    data=WSPointSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = WSPoint.objects.all()

            if type_val:
                queryset = queryset.filter(type__icontains=type_val)

            if name:
                queryset = queryset.filter(name__icontains=name)

            serializer = WSPointSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="WS Point Feature list fetched successfully.",
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

    @action(detail=True, methods=["get"], url_path="geojson")
    def geojson(self, request, pk=None):
        try:
            obj = WSPoint.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="WS Point Feature not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=WSPointSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()