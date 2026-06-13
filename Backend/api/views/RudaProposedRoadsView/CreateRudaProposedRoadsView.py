from ..common_imports import *


class CreateRudaProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = RudaProposedRoadsSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            obj = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Road created successfully",
                data=RudaProposedRoadsSerializer(obj).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()