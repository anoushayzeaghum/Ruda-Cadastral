from ...common_imports import *


class UpdateLahoreTransportationRoadView(viewsets.ViewSet):
    queryset = LahoreTransportationRoad.objects.all()
    serializer_class = LahoreTransportationRoadSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):

        data = request.data
        road_id = kwargs.get("pk")

        try:
            road = LahoreTransportationRoad.objects.get(gid=road_id)

        except LahoreTransportationRoad.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Road not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            serializer = LahoreTransportationRoadSerializer(
                road,
                data=data,
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Road updated successfully.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()