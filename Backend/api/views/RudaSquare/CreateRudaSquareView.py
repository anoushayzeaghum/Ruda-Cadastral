from ..common_imports import *


class CreateRudaSquareView(viewsets.ViewSet):

    queryset = RudaSquare.objects.all()
    serializer_class = RudaSquareSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        try:

            serializer = RudaSquareSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            square = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Ruda Square created successfully.",
                data=RudaSquareSerializer(square).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Serializer error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()