from ..common_imports import *

class DeleteMouzaView(viewsets.ViewSet):
    queryset = Mouza.objects.all()
    serializer_class = MouzaSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        mouza_id = kwargs.get("pk")

        try:
            mouza = Mouza.objects.get(id=mouza_id)
        except Mouza.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Mouza not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            mouza.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mouza deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Mouza because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()