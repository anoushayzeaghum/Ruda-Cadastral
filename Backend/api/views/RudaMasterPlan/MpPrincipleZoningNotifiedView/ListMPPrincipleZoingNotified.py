from ...common_imports import *


class ListMPPrincipleZoingNotifiedView(viewsets.ViewSet):
    queryset = MPPrincipleZoingNotified.objects.all()
    serializer_class = MPPrincipleZoingNotifiedSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "area225a",
        "zoning_cat",
        "area_sqft",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            if gid not in [None, ""]:
                record = (
                    MPPrincipleZoingNotified.objects
                    .only("gid", "area225a", "zoning_cat", "area_sqft", "geom")
                    .filter(gid=gid)
                    .first()
                )

                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="MP Principle Zoing Notified not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="MP Principle Zoing Notified found.",
                    data=self.serializer_class(record).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}
            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = (
                MPPrincipleZoingNotified.objects
                .only("gid", "area225a", "zoning_cat", "area_sqft", "geom")
                .filter(**filters)
                .order_by("gid")
            )

            serializer = self.serializer_class(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MP Principle Zoing Notified records found.",
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
            record = (
                MPPrincipleZoingNotified.objects
                .only("gid", "area225a", "zoning_cat", "area_sqft", "geom")
                .filter(gid=pk)
                .first()
            )

            if not record:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="MP Principle Zoing Notified not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON found.",
                data=self.serializer_class(record).data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
