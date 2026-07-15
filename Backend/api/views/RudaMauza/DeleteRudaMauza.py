from ..common_imports import *

class DeleteRudaMauzaView(viewsets.ViewSet):
    queryset = RudaMauza.objects.all()
    serializer_class = RudaMauzaSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        RudaMauza_id = kwargs.get("pk")

        try:
            RudaMauza = RudaMauza.objects.get(id=RudaMauza_id)
        except RudaMauza.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="RudaMauza not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            RudaMauza.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaMauza deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this RudaMauza because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()