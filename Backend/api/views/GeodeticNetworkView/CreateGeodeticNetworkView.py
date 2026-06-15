from ..common_imports import *


class CreateGeodeticNetworkView(viewsets.ViewSet):
    queryset = GeodeticNetwork.objects.all()
    serializer_class = GeodeticNetworkSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            serializer = GeodeticNetworkSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            obj = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="GeodeticNetwork created successfully.",
                data=GeodeticNetworkSerializer(obj).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
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