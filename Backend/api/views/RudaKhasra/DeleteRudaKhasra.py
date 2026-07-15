from ..common_imports import *

class DeleteRudaKhasraView(viewsets.ViewSet):
    queryset = RudaKhasra.objects.all()
    serializer_class = RudaKhasraSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        RudaKhasra_id = kwargs.get("pk")

        try:
            RudaKhasra = RudaKhasra.objects.get(id=RudaKhasra_id)

        except RudaKhasra.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="RudaKhasra not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            RudaKhasra.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaKhasra deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this RudaKhasra because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()