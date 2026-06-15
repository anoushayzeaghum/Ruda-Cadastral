from ...common_imports import *
from rest_framework.decorators import action


class ListProjectView(viewsets.ViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            project_type = request.query_params.get("type")
            brief_name = request.query_params.get("brief_name")

            if gid:
                obj = Project.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Project not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Project found.",
                    data=ProjectSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Project.objects.all()

            if name:
                queryset = queryset.filter(name__icontains=name)

            if project_type:
                queryset = queryset.filter(type__iexact=project_type)

            if brief_name:
                queryset = queryset.filter(brief_name__icontains=brief_name)

            serializer = ProjectSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Project list fetched successfully.",
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
            obj = Project.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Project not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=ProjectSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()