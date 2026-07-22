from ..common_imports import *

class UpdateRudaMauzaView(viewsets.ViewSet):
    queryset = RudaMauza.objects.all()
    serializer_class = RudaMauzaSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):

        data = request.data
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
            serializer = RudaMauzaSerializer(RudaMauza, data=data, partial=True)

            if serializer.is_valid():
                serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaMauza updated successfully.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()