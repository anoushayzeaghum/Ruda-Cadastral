from ..common_imports import *

class DeleteRudaMauzaView(viewsets.ViewSet):
    queryset = Mauza.objects.all()
    serializer_class = MauzaSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        mauza_id = kwargs.get("pk")

        try:
            mauza = Mauza.objects.get(id=mauza_id)
        except Mauza.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Mauza not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            mauza.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauza deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Mauza because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()