from ...common_imports import *
from rest_framework.decorators import action


class ListBlockView(viewsets.ViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            block = request.query_params.get("block")
            project_id = request.query_params.get("project_id")

            queryset = Block.objects.all().order_by("gid")

            if gid:
                queryset = queryset.filter(gid=gid)

            if project_id:
                queryset = queryset.filter(project_id=project_id)

            if name:
                queryset = queryset.filter(name__icontains=name)

            if block:
                queryset = queryset.filter(block__iexact=block)

            serializer = BlockSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Block list fetched successfully.",
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