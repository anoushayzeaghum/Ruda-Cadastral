from ..common_imports import *

class DeleteKhasraView(viewsets.ViewSet):
    queryset = Khasra.objects.all()
    serializer_class = KhasraSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        khasra_id = kwargs.get("pk")

        try:
            khasra = Khasra.objects.get(id=khasra_id)

        except Khasra.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Khasra not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            khasra.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Khasra deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Khasra because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()