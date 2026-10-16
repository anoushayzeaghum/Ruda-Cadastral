from ...common_imports import *

class CreateKlmToSaggianView(viewsets.ViewSet):
    """Insert one feature; only authenticated users may write."""
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = KlmToSaggianSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Invalid KLM to Saggian feature.",
                data=serializer.errors, http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()
        try:
            record = serializer.save()
        except Exception:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Could not create KLM to Saggian feature.",
                data={}, http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
        return ApiResponse(
            status=status.HTTP_201_CREATED,
            message="KLM to Saggian feature created.",
            data=KlmToSaggianSerializer(record).data,
            http_status=status.HTTP_201_CREATED,
        ).create_response()
