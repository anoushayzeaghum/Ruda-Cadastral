from ..common_imports import *
from rest_framework.decorators import action
from rest_framework.response import Response

class ListRudaBoundaryView(viewsets.ViewSet):
    queryset = RudaBoundary.objects.all()
    serializer_class = RudaBoundarySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            oid = request.query_params.get("oid")

            # Single RudaBoundary by gid
            if gid:
                ruda_boundary = RudaBoundary.objects.filter(gid=gid).first()

                if not ruda_boundary:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="RudaBoundary not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = RudaBoundarySerializer(ruda_boundary)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by name
            elif name:
                queryset = RudaBoundary.objects.filter(name=name)
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary records found for name.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by oid
            elif oid:
                queryset = RudaBoundary.objects.filter(oid=oid)
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary records found for oid.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All RudaBoundary records
            else:
                queryset = RudaBoundary.objects.all()
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All RudaBoundary records found.",
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
        """Return RudaBoundary boundary as GeoJSON"""
        try:
            ruda_boundary = RudaBoundary.objects.filter(gid=pk).first()

            if not ruda_boundary:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="RudaBoundary not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = RudaBoundarySerializer(ruda_boundary)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaBoundary GeoJSON found.",
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