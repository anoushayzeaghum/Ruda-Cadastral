from ...common_imports import *


class ListProjectMauzaView(viewsets.ViewSet):
    queryset = ProjectMauza.objects.all()
    serializer_class = ProjectMauzaSerializer
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            project_id = request.query_params.get("project_id")
            mauza_id = request.query_params.get("mauza_id")
            khasra_id = request.query_params.get("khasra_id")

            qs = (
                ProjectMauza.objects
                .select_related(
                    "project",
                    "mauza",
                    "khasra"
                )
                .all()
            )

            if project_id:
                qs = qs.filter(project_id=project_id)

            if mauza_id:
                qs = qs.filter(mauza_id=mauza_id)

            if khasra_id:
                qs = qs.filter(khasra_id=khasra_id)

            serializer = ProjectMauzaSerializer(qs, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Project mauzas fetched successfully.",
                data=serializer.data,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
            ).create_response()