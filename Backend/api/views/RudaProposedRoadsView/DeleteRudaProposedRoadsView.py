from ..common_imports import *


class DeleteRudaProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        try:
            obj = RudaProposedRoads.objects.get(gid=pk)
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road deleted successfully",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except RudaProposedRoads.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Road not found",
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