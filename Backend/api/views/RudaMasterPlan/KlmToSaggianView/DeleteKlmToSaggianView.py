from ...common_imports import *

class DeleteKlmToSaggianView(viewsets.ViewSet):
    """Delete a feature by its gid. Destructive: requires authentication."""
    permission_classes = [IsAuthenticated]

    def destroy(self, request, pk=None, *args, **kwargs):
        try:
            record = KlmToSaggian.objects.get(gid=pk)
        except (KlmToSaggian.DoesNotExist, ValueError, TypeError):
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="KLM to Saggian feature not found.",
                data={}, http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()
        try:
            record.delete()
        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_409_CONFLICT,
                message="Feature is referenced by other records.",
                data={}, http_status=status.HTTP_409_CONFLICT,
            ).create_response()
        except Exception:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Could not delete KLM to Saggian feature.",
                data={}, http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
        return ApiResponse(
            status=status.HTTP_200_OK,
            message="KLM to Saggian feature deleted.",
            data={"gid": int(pk)}, http_status=status.HTTP_200_OK,
        ).create_response()
