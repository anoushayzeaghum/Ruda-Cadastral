from ..common_imports import *
from django.core.cache import cache


class CreateProposedRoadView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        try:
            serializer = ProposedRoadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            obj = serializer.save()

            cache.delete(f"proposed_roads_geojson_{obj.gid}")

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Proposed road created successfully",
                data=ProposedRoadSerializer(obj).data,
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

    # Optional alias for code that calls this view directly instead of through DRF's router.
    def post(self, request):
        return self.create(request)
