from ...common_imports import *


class DeleteFloodExtentScenariosView(viewsets.ViewSet):

    queryset = FloodExtentScenarios.objects.all()
    serializer_class = FloodExtentScenariosSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        flood_extent_scenario_id = kwargs.get("pk")

        try:

            flood_extent_scenario = FloodExtentScenarios.objects.get(
                gid=flood_extent_scenario_id
            )

        except FloodExtentScenarios.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Flood extent scenario not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            flood_extent_scenario.delete()

            # Clear caches
            cache.delete(
                f"flood_extent_scenario_{flood_extent_scenario_id}"
            )

            cache.delete(
                f"flood_extent_scenario_geojson_{flood_extent_scenario_id}"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Flood extent scenario deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Flood extent scenario because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
