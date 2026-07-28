from ..common_imports import *
from django.core.cache import cache


class DeleteProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def destroy(self, request, pk=None):
        try:
            obj = ProposedRoads.objects.get(gid=pk)
            gid = obj.gid
            obj.delete()

            cache.delete(f"proposed_roads_geojson_{gid}")

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Proposed road deleted successfully",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProposedRoads.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Proposed road not found",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete linked record",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    # Optional alias for direct invocation.
    def delete(self, request, pk=None):
        return self.destroy(request, pk=pk)
