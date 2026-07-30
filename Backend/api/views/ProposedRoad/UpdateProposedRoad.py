from ..common_imports import *
from django.core.cache import cache


class UpdateProposedRoadView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def update(self, request, pk=None, partial=False):
        try:
            instance = ProposedRoad.objects.get(gid=pk)

            serializer = ProposedRoadSerializer(
                instance,
                data=request.data,
                partial=partial,
            )
            serializer.is_valid(raise_exception=True)
            obj = serializer.save()

            cache.delete(f"proposed_roads_geojson_{obj.gid}")

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Proposed road updated successfully",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProposedRoad.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Proposed road not found",
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

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk, partial=True)

    # Optional aliases for direct invocation.
    def put(self, request, pk=None):
        return self.update(request, pk=pk, partial=False)

    def patch(self, request, pk=None):
        return self.partial_update(request, pk=pk)
