from ...common_imports import *


class UpdateJinnahAvenueRoadView(viewsets.ViewSet):
    queryset = JinnahAvenueRoad.objects.all()
    serializer_class = JinnahAvenueRoadSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = JinnahAvenueRoad.objects.get(gid=record_id)
        except JinnahAvenueRoad.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="JinnahAvenueRoad not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            serializer = JinnahAvenueRoadSerializer(
                record,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="JinnahAvenueRoad updated successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
