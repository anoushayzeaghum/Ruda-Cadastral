from ...common_imports import *


class CreateSWLineView(viewsets.ViewSet):

    def create(self, request):

        try:

            serializer = SWLineSerializer(
                data=request.data
            )

            serializer.is_valid(
                raise_exception=True
            )

            sw_line = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="SW Line created successfully.",
                data=FloodExtentSerializer(
                    sw_line
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