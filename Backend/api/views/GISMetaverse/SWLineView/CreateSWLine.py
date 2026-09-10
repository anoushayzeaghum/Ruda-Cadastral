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
                data=SWLineSerializer(sw_line).data,
                message="SW Line created successfully",
                status_code=status.HTTP_201_CREATED
            ).create_response()

        except serializers.ValidationError as e:

            return ApiResponse(
                message=e.detail,
                status_code=status.HTTP_400_BAD_REQUEST
            ).create_response()

        except Exception as e:

            return ApiResponse(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            ).create_response()