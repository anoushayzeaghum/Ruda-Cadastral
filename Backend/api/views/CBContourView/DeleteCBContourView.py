from ..common_imports import *

class DeleteCBContourView(viewsets.ViewSet):
    queryset = CBContour.objects.all()
    serializer_class = CBContourSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        contour_id = kwargs.get("pk")

        try:
            obj = CBContour.objects.get(gid=contour_id)

        except CBContour.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="CB Contour not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CB Contour deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete CB Contour because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()