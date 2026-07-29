from ..common_imports import *


class ListForestBoundaryView(viewsets.ViewSet):
    queryset = ForestBoundary.objects.all()
    serializer_class = ForestBoundarySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            f_zone = request.query_params.get("f_zone")
            f_circle = request.query_params.get("f_circle")
            f_div = request.query_params.get("f_div")
            f_name = request.query_params.get("f_name")
            f_type = request.query_params.get("f_type")
            legal_stat = request.query_params.get("legal_stat")

            queryset = ForestBoundary.objects.all().order_by("gid")

            if gid:
                queryset = queryset.filter(gid=gid)

            if f_zone:
                queryset = queryset.filter(f_zone__iexact=f_zone)

            if f_circle:
                queryset = queryset.filter(f_circle__iexact=f_circle)

            if f_div:
                queryset = queryset.filter(f_div__iexact=f_div)

            if f_name:
                queryset = queryset.filter(f_name__icontains=f_name)

            if f_type:
                queryset = queryset.filter(f_type__iexact=f_type)

            if legal_stat:
                queryset = queryset.filter(legal_stat__iexact=legal_stat)

            serializer = ForestBoundarySerializer(
                queryset,
                many=True
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Forest boundaries fetched successfully.",
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