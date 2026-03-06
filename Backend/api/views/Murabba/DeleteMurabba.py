from ..common_imports import *

class DeleteMurabbaView(viewsets.ViewSet):
    queryset = Murabba.objects.all()
    serializer_class = MurabbaSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        murabba_id = kwargs.get("pk")

        try:
            murabba = Murabba.objects.get(id=murabba_id)

        except Murabba.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Murabba not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            murabba.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Murabba deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this Murabba because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()