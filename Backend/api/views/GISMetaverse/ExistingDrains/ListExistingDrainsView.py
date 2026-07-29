from ...common_imports import *


class ListExistingDrainView(viewsets.ViewSet):
    queryset = ExistingDrain.objects.all()
    serializer_class = ExistingDrainSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")

            queryset = ExistingDrain.objects.all().order_by("gid")

            if gid:
                queryset = queryset.filter(gid=gid)

            if name:
                queryset = queryset.filter(name__icontains=name)

            serializer = ExistingDrainSerializer(
                queryset,
                many=True
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Existing drains fetched successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()