from ...common_imports import *
from rest_framework.decorators import action


class ListCameraLocationView(viewsets.ViewSet):
    queryset = CameraLocation.objects.all()
    serializer_class = CameraLocationSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            project = request.query_params.get("project")
            project_id = request.query_params.get("project_id")
            camera = request.query_params.get("camera")

            queryset = CameraLocation.objects.select_related(
                "project_fk"
            )

            if gid:
                obj = queryset.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="CameraLocation not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="CameraLocation found.",
                    data=CameraLocationSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            if project:
                queryset = queryset.filter(
                    project__icontains=project
                )

            if project_id:
                queryset = queryset.filter(
                    project_fk_id=project_id
                )

            if camera:
                queryset = queryset.filter(
                    camera__icontains=camera
                )

            serializer = CameraLocationSerializer(
                queryset,
                many=True
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CameraLocation list fetched successfully.",
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