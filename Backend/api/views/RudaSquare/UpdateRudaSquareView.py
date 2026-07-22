from ..common_imports import *


class UpdateRudaSquareView(viewsets.ViewSet):

    queryset = RudaSquare.objects.all()
    serializer_class = RudaSquareSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):

        gid = kwargs.get("pk")

        try:
            square = RudaSquare.objects.get(gid=gid)

        except RudaSquare.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Ruda Square not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        serializer = RudaSquareSerializer(
            square,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():

            serializer.save()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Ruda Square updated successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        return ApiResponse(
            status=status.HTTP_400_BAD_REQUEST,
            message="Validation error.",
            data=serializer.errors,
            http_status=status.HTTP_400_BAD_REQUEST,
        ).create_response()