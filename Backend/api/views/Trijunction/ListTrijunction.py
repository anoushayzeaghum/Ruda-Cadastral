from rest_framework.decorators import action
from ..common_imports import *


class ListTrijunctionView(viewsets.ViewSet):
    queryset = Trijunction.objects.all()
    serializer_class = TrijunctionSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            m1 = request.query_params.get("m1")
            m2 = request.query_params.get("m2")
            m3 = request.query_params.get("m3")
            mouza = request.query_params.get("mouza")
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

            queryset = Trijunction.objects.all()

            if m1:
                queryset = queryset.filter(m1__iexact=m1)

            if m2:
                queryset = queryset.filter(m2__iexact=m2)

            if m3:
                queryset = queryset.filter(m3__iexact=m3)

            if junction_type:
                queryset = queryset.filter(type__iexact=junction_type)

            # TJ points -> use ONLY m3 as mouza name
            if junction_type and junction_type.upper() == "TJ" and mouza:
                queryset = queryset.filter(m3__iexact=mouza)

            # B points -> no mouza filter, show all control points
            # so do nothing extra here

            serializer = TrijunctionSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Trijunctions found.",
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