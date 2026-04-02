from ..common_imports import *
from rest_framework.decorators import action


class ListTrijunctionView(viewsets.ViewSet):
    queryset = Trijunction.objects.all()
    serializer_class = TrijunctionSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            trijunction_id = request.query_params.get("id")
            m1 = request.query_params.get("m1")
            m2 = request.query_params.get("m2")
            m3 = request.query_params.get("m3")
            junction_type = request.query_params.get("type")

            if gid:
                trijunction = Trijunction.objects.filter(gid=gid).first()

                if not trijunction:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Trijunction not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = TrijunctionSerializer(trijunction)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunction found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif trijunction_id:
                queryset = Trijunction.objects.filter(id=trijunction_id)
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunctions found for id.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif m1:
                queryset = Trijunction.objects.filter(m1__iexact=m1)
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunctions found for m1.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif m2:
                queryset = Trijunction.objects.filter(m2__iexact=m2)
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunctions found for m2.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif m3:
                queryset = Trijunction.objects.filter(m3__iexact=m3)
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunctions found for m3.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif junction_type:
                queryset = Trijunction.objects.filter(type__iexact=junction_type)
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunctions found for type.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            else:
                queryset = Trijunction.objects.all()
                serializer = TrijunctionSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All Trijunctions found.",
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
            trijunction = Trijunction.objects.filter(gid=pk).first()

            if not trijunction:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Trijunction not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = TrijunctionSerializer(trijunction)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Trijunction GeoJSON found.",
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