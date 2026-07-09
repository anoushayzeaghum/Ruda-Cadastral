from ...common_imports import *
from rest_framework.decorators import action

class ListSWPointView(viewsets.ViewSet):
    queryset = SWPoint.objects.select_related("project")
    serializer_class = SWPointSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            type_val = request.query_params.get("type")
            project_id = request.query_params.get("project_id")

            if gid:
                obj = (
                    SWPoint.objects
                    .select_related("project")
                    .filter(gid=gid)
                    .first()
                )

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="SW Point not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="SW Point found.",
                    data=SWPointSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = SWPoint.objects.select_related("project")

            if name:
                queryset = queryset.filter(
                    name__icontains=name
                )

            if type_val:
                queryset = queryset.filter(
                    type__icontains=type_val
                )

            if project_id:
                queryset = queryset.filter(
                    project__gid=project_id
                )

            serializer = SWPointSerializer(
                queryset,
                many=True
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SW Point list fetched successfully.",
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