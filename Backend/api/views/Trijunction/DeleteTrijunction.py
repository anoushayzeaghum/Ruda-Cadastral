from ..common_imports import *


class DeleteTrijunctionView(viewsets.ViewSet):
    queryset = Trijunction.objects.all()
    serializer_class = TrijunctionSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        trijunction_id = kwargs.get("pk")

        try:
            trijunction = Trijunction.objects.get(gid=trijunction_id)
        except Trijunction.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Trijunction not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            trijunction.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Trijunction deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Trijunction because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()