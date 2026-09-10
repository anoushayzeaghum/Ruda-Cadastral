from ...common_imports import *


class UpdateSWLineView(viewsets.ViewSet):

    def update(self, request, pk=None):

        try:

            sw_line = SWLine.objects.filter(
                gid=pk
            ).first()

            if not sw_line:
                return ApiResponse(
                    message="SW Line not found",
                    status_code=status.HTTP_404_NOT_FOUND
                ).create_response()

            serializer = SWLineSerializer(
                sw_line,
                data=request.data,
                partial=True
            )

            serializer.is_valid(
                raise_exception=True
            )

            sw_line = serializer.save()

            # Clear caches
            cache.delete(
                f"sw_line_{pk}"
            )

            cache.delete(
                f"sw_line_geojson_{pk}"
            )

            return ApiResponse(
                data=SWLineSerializer(sw_line).data,
                message="SW Line updated successfully",
                status_code=status.HTTP_200_OK
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