from ..common_imports import *
from rest_framework.decorators import action


class ListMauzaView(viewsets.ViewSet):
    queryset = Mauza.objects.all()
    serializer_class = MauzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            mauza_id = request.query_params.get("mauza_id") or request.query_params.get("id")

            district_id = (
                request.query_params.get("district_id")
                or request.query_params.get("dist_id")
            )

            tehsil_id = request.query_params.get("tehsil_id")

            # Single Mauza
            if mauza_id:

                obj = Mauza.objects.filter(
                    mauza_id=mauza_id
                ).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Mauza not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MauzaSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mauza found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Mauza.objects.all()

            # Filter by district
            if district_id:
                queryset = queryset.filter(
                    district_id=district_id
                )

            # Filter by tehsil
            if tehsil_id:
                queryset = queryset.filter(
                    tehsil_id=tehsil_id
                )

            serializer = MauzaSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauzas found.",
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
            obj = Mauza.objects.filter(
                mauza_id=pk
            ).first()

            if not obj:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Mauza not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = MauzaSerializer(obj)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauza GeoJSON found.",
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