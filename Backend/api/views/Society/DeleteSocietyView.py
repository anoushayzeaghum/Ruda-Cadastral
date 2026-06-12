from ..common_imports import *

class DeleteSocietyView(viewsets.ViewSet):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        society_id = kwargs.get("pk")

        try:
            society = Society.objects.get(gid=society_id)
        except Society.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Society not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            society.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Society deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete Society because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()