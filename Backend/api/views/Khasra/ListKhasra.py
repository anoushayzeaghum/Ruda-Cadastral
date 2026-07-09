from ..common_imports import *
from rest_framework.decorators import action
from rest_framework.response import Response
import traceback

class ListKhasraView(viewsets.ViewSet):
    queryset = Khasra.objects.all()
    serializer_class = KhasraSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        
        try:
            gid = request.query_params.get("gid") or request.query_params.get("id")
            mauza_id = request.query_params.get("mauza_id")
            tehsil_id = request.query_params.get("tehsil_id")
            dist_id = request.query_params.get("dist_id")

            if gid:
                obj = Khasra.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Khasra not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = KhasraSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasra found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Khasra.objects.select_related(
                "district",
                "tehsil",
                "mauza"
            )

            if dist_id:
                queryset = queryset.filter(district_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            serializer = KhasraSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Khasra data fetched successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            print("\n========== KHASRA ERROR ==========")
            print(traceback.format_exc())
            print("=================================\n")

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(detail=True, methods=['get'], url_path='geojson', url_name='geojson')
    def geojson(self, request, pk=None):
        """Return Khasra boundary as GeoJSON"""
        try:
            khasra = Khasra.objects.filter(gid=pk).first()

            if not khasra:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Khasra not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = KhasraSerializer(khasra)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Khasra GeoJSON found.",
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