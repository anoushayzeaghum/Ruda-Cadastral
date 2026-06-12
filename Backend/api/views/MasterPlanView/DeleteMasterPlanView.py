from ..common_imports import *

class DeleteMasterPlanView(viewsets.ViewSet):
    queryset = MasterPlan.objects.all()
    serializer_class = MasterPlanSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        mp_id = kwargs.get("pk")

        try:
            obj = MasterPlan.objects.get(gid=mp_id)

        except MasterPlan.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="MasterPlan not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MasterPlan deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete MasterPlan because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()