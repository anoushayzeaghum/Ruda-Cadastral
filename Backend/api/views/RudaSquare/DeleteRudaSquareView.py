from ..common_imports import *


class DeleteRudaSquareView(viewsets.ViewSet):

    queryset = RudaSquare.objects.all()
    serializer_class = RudaSquareSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        gid = kwargs.get("pk")

        try:
            square = RudaSquare.objects.get(gid=gid)

        except RudaSquare.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Ruda Square not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            square.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Ruda Square deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this record.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()