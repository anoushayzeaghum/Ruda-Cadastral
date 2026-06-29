from ..common_imports import *
from rest_framework.decorators import action


class ListFieldPointsView(viewsets.ViewSet):
    queryset = FieldPoints.objects.all()
    serializer_class = FieldPointsSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza_id = request.query_params.get("mauza_id")

            if gid:
                obj = (
                    FieldPoints.objects
                    .select_related("mauza")
                    .filter(gid=gid)
                    .first()
                )

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

            queryset = FieldPoints.objects.select_related("mauza")

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            serializer = FieldPointsSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPoints fetched successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            import traceback

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
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
            obj = (
                FieldPoints.objects
                .select_related("mauza")
                .filter(gid=pk)
                .first()
            )

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
            import traceback

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()