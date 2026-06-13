from ..common_imports import *


class UpdateRudaProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        return self.update(request, pk)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        try:
            instance = RudaProposedRoads.objects.get(gid=pk)

            serializer = RudaProposedRoadsSerializer(
                instance,
                data=request.data,
                partial=partial
            )

            serializer.is_valid(raise_exception=True)
            serializer.save()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road updated successfully",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except RudaProposedRoads.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Road not found",
                http_status=status.HTTP_404_NOT_FOUND,
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