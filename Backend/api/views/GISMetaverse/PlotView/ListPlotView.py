from ...common_imports import *
from rest_framework.decorators import action


class ListPlotView(viewsets.ViewSet):
    queryset = Plot.objects.all()
    serializer_class = PlotSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            plot_nu = request.query_params.get("plot_nu")
            block = request.query_params.get("block")
            plot_area = request.query_params.get("plot_area")
            plot_type = request.query_params.get("type")

            if gid:
                obj = Plot.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Plot not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Plot found.",
                    data=PlotSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Plot.objects.all()

            if plot_nu:
                queryset = queryset.filter(plot_nu__iexact=plot_nu)

            if block:
                queryset = queryset.filter(block__iexact=block)

            if plot_area:
                queryset = queryset.filter(plot_area__icontains=plot_area)

            if plot_type:
                queryset = queryset.filter(type__iexact=plot_type)

            serializer = PlotSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Plot list fetched successfully.",
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

    @action(detail=True, methods=["get"], url_path="geojson", url_name="geojson")
    def geojson(self, request, pk=None):
        try:
            obj = Plot.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Plot not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=PlotSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()