from ...common_imports import *


class DeleteLahoreTransportationRoadView(viewsets.ViewSet):
    queryset = LahoreTransportationRoad.objects.all()
    serializer_class = LahoreTransportationRoadSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

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

            road.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Road because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()