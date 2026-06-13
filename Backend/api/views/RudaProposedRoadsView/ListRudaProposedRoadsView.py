from ..common_imports import *

class ListRudaProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            queryset = RudaProposedRoads.objects.all()

            gid = request.query_params.get("gid")
            name = request.query_params.get("name")

            if gid:
                queryset = queryset.filter(gid=gid)

            if name:
                queryset = queryset.filter(name__icontains=name)

            serializer = RudaProposedRoadsSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Roads fetched successfully",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()