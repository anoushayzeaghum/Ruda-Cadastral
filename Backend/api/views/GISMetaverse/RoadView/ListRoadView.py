from ...common_imports import *
from rest_framework.decorators import action


class ListRoadView(viewsets.ViewSet):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            block = request.query_params.get("block")
            road_type = request.query_params.get("type")
            project_id = request.query_params.get("project_id")
            block_id = request.query_params.get("block_id")
            if gid:
                obj = Road.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Road not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Road found.",
                    data=RoadSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Road.objects.exclude(geom__isnull=True).order_by("gid")

            if project_id:
                queryset = queryset.filter(project_id=project_id)

            if block_id:
                queryset = queryset.filter(block_id=block_id)

            if name:
                queryset = queryset.filter(name__icontains=name)

            if block:
                # Match either the related Block.block value or the road table's own block FK id.
                # This keeps the endpoint safe even when the block relation is incomplete.
                queryset = queryset.filter(block__block__icontains=block)

            if road_type:
                queryset = queryset.filter(type__icontains=road_type)

            serializer = RoadSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road list fetched successfully.",
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

    @action(detail=True, methods=["get"], url_path="geojson")
    def geojson(self, request, pk=None):
        try:
            obj = Road.objects.filter(gid=pk).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Road not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
                data=RoadSerializer(obj).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
