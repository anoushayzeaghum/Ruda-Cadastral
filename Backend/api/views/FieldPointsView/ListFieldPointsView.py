from ..common_imports import *
from rest_framework.decorators import action

class ListFieldPointsView(viewsets.ViewSet):
    queryset = FieldPoints.objects.all()
    serializer_class = FieldPointsSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza = request.query_params.get("mauza")
            sq = request.query_params.get("sq")

            if gid:
                obj = FieldPoints.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="FieldPoints not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="FieldPoints found.",
                    data=FieldPointsSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = FieldPoints.objects.all()

            if mauza:
                queryset = queryset.filter(mauza__iexact=mauza)

            if sq:
                queryset = queryset.filter(sq=sq)

            serializer = FieldPointsSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPointss fetched successfully.",
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
            obj = FieldPoints.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="FieldPoints not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPoints GeoJSON fetched.",
                data=FieldPointsSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()