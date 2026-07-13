from ...common_imports import *


class DeleteKatarBandWWTPView(viewsets.ViewSet):
    queryset = KatarBandWWTP.objects.all()
    serializer_class = KatarBandWWTPSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = KatarBandWWTP.objects.get(gid=record_id)
            record.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KatarBandWWTP deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except KatarBandWWTP.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="KatarBandWWTP not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()