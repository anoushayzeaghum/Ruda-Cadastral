from ...common_imports import *


class CreateFloodExtentView(viewsets.ViewSet):

    queryset = FloodExtent.objects.all()
    serializer_class = FloodExtentSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        data = request.data

        try:

            serializer = FloodExtentSerializer(
                data=data
            )

            serializer.is_valid(
                raise_exception=True
            )

            flood_extent = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Flood extent created successfully.",
                data=FloodExtentSerializer(
                    flood_extent
                ).data,
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