from ...common_imports import *

class UpdateKlmToSaggianView(viewsets.ViewSet):
    """Update fields of a feature selected by primary key (gid)."""
    permission_classes = [IsAuthenticated]

    def update(self, request, pk=None, *args, **kwargs):
        try:
            record = KlmToSaggian.objects.get(gid=pk)
        except (KlmToSaggian.DoesNotExist, ValueError, TypeError):
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="KLM to Saggian feature not found.",
                data={}, http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        serializer = KlmToSaggianSerializer(record, data=request.data, partial=True)
        if not serializer.is_valid():
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Invalid feature update.",
                data=serializer.errors, http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()
        try:
            record = serializer.save()
        except Exception:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Could not update KLM to Saggian feature.",
                data={}, http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
        return ApiResponse(
            status=status.HTTP_200_OK,
            message="KLM to Saggian feature updated.",
            data=KlmToSaggianSerializer(record).data,
            http_status=status.HTTP_200_OK,
        ).create_response()

    def partial_update(self, request, pk=None, *args, **kwargs):
        return self.update(request, pk=pk, *args, **kwargs)
