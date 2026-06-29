from ...common_imports import *

class PlotOptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        project_id = request.GET.get("project_id")
        block = request.GET.get("block")
        plot_type = request.GET.get("type")
        plot_area = request.GET.get("plot_area")

        queryset = Plot.objects.select_related(
            "project",
            "block"
        )

        # Project filter
        if project_id:
            queryset = queryset.filter(
                project__gid=project_id
            )

        # Block filter
        if block:
            queryset = queryset.filter(
                block__block__iexact=block
            )

        # Plot Type filter
        if plot_type:
            queryset = queryset.filter(
                type__iexact=plot_type
            )

        # Area filter
        if plot_area:
            queryset = queryset.filter(
                plot_area__iexact=plot_area
            )

        plot_types = (
            queryset
            .exclude(type__isnull=True)
            .exclude(type="")
            .values_list("type", flat=True)
            .distinct()
        )

        areas = (
            queryset
            .exclude(plot_area__isnull=True)
            .exclude(plot_area="")
            .values_list("plot_area", flat=True)
            .distinct()
        )

        plot_nos = (
            queryset
            .exclude(plot_no__isnull=True)
            .exclude(plot_no="")
            .values_list("plot_no", flat=True)
            .distinct()
        )

        return Response({
            "plotTypes": list(plot_types),
            "areas": list(areas),
            "plotNos": list(plot_nos),
        })