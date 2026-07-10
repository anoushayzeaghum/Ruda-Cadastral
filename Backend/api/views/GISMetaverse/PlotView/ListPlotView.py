from ...common_imports import *
from django.db.models import Q

import traceback
class ListPlotView(viewsets.ViewSet):
    queryset = Plot.objects.all()
    serializer_class = PlotSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            project_id = request.query_params.get("project_id")
            block_id = request.query_params.get("block_id")
            plot_no = request.query_params.get("plot_no")
            block = request.query_params.get("block")
            plot_area = request.query_params.get("plot_area")
            plot_type = request.query_params.get("type")

            # ⭐ GLOBAL SEARCH PARAM
            search = request.query_params.get("search")

            queryset = (
                Plot.objects
                .select_related("project", "block")
                .order_by("gid")
            )

            # ----------------------------
            # EXISTING FILTERS
            # ----------------------------
            if gid:
                queryset = queryset.filter(gid=gid)

            if project_id:
                queryset = queryset.filter(project__gid=project_id)

            if block_id:
                queryset = queryset.filter(block__gid=block_id)

            if block:
                queryset = queryset.filter(block__block__iexact=block)

            if plot_no:
                queryset = queryset.filter(plot_no__iexact=plot_no)

            # if block:
            #     queryset = queryset.filter(block__block__iexact=block)

            if plot_area:
                queryset = queryset.filter(plot_area__iexact=plot_area)

            if plot_type:
                queryset = queryset.filter(type__iexact=plot_type)

            # ----------------------------
            # ⭐ GLOBAL SEARCH (ATTRIBUTE TABLE)
            # ----------------------------
            if search:
                queryset = queryset.filter(
                    Q(plot_no__icontains=search) |
                    Q(name__icontains=search) |
                    Q(type__icontains=search) |
                    Q(plot_area__icontains=search) |
                    Q(project__name__icontains=search) |
                    Q(block__name__icontains=search) |
                    Q(block__block__icontains=search)
                )

            # ----------------------------
            # SERIALIZER
            # ----------------------------
            serializer = PlotSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Plot list fetched successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()