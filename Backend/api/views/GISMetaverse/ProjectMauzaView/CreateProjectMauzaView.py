from ...common_imports import *


class CreateProjectMauzaView(viewsets.ViewSet):
    queryset = ProjectMauza.objects.all()
    serializer_class = ProjectMauzaSerializer
    permission_classes = [AllowAny]

    def create(self, request):
        try:
            project_id = request.data.get("project_id")
            mauza_ids = request.data.get("mauza_ids", [])

            if not project_id or not mauza_ids:
                return ApiResponse(
                    status=status.HTTP_400_BAD_REQUEST,
                    message="project_id and mauza_ids are required",
                ).create_response()

            # delete old mappings (optional but recommended for overwrite behavior)
            ProjectMauza.objects.filter(project_id=project_id).delete()

            # bulk insert
            objects = [
                ProjectMauza(project_id=project_id, mauza_id=m_id)
                for m_id in mauza_ids
            ]

            ProjectMauza.objects.bulk_create(objects)

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Mauzas assigned to project successfully.",
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
            ).create_response()