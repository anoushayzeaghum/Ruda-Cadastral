from ..common_imports import *
from rest_framework.decorators import action
from rest_framework.response import Response

class ListMauzaView(viewsets.ViewSet):
    queryset = Mauza.objects.all()
    serializer_class = MauzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            mauza_id = request.query_params.get("id") or request.query_params.get("mauza_id")

            # Support both district name or id (dist_id / district_id)
            district = (
                request.query_params.get("district")
                or request.query_params.get("district_id")
                or request.query_params.get("dist_id")
            )

            # Support both tehsil name or id (tehsil_id)
            tehsil = (
                request.query_params.get("tehsil")
                or request.query_params.get("tehsil_id")
            )

            # Single Mauza
            if mauza_id:
                # Mauza model uses `mauza_id` as identifier in DB
                mauza = Mauza.objects.filter(mauza_id=mauza_id).first()

                if not mauza:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Mauza not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MauzaSerializer(mauza)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mauza found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by district
            elif district:
                # district can be name or numeric id
                try:
                    # numeric id
                    district_int = int(district)
                    queryset = Mauza.objects.filter(dist_id=district_int)
                except Exception:
                    queryset = Mauza.objects.filter(district=district)

                serializer = MauzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mauzas found for district.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by tehsil
            elif tehsil:
                # tehsil can be name or numeric id
                try:
                    tehsil_int = int(tehsil)
                    queryset = Mauza.objects.filter(tehsil_id=tehsil_int)
                except Exception:
                    queryset = Mauza.objects.filter(tehsil=tehsil)

                serializer = MauzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mauzas found for tehsil.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All Mauzas
            else:
                queryset = Mauza.objects.all()

                serializer = MauzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All Mauzas found.",
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

    @action(detail=True, methods=['get'], url_path='geojson', url_name='geojson')
    def geojson(self, request, pk=None):
        """Return Mauza boundary as GeoJSON"""
        try:
            mauza = Mauza.objects.filter(mauza_id=pk).first()

            if not mauza:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Mauza not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = MauzaSerializer(mauza)

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