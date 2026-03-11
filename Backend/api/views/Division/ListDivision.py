from ..common_imports import *
from rest_framework.decorators import action
from rest_framework.response import Response

class ListDivisionView(viewsets.ViewSet):

    queryset = Division.objects.all()
    serializer_class = DivisionSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            division_id = request.query_params.get("id")

            if division_id:

                division = Division.objects.filter(gid=division_id).first()

                if not division:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Division not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = DivisionSerializer(division)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Division found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Division.objects.all()

            serializer = DivisionSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="All divisions found.",
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
        """Return Division boundary as GeoJSON"""
        try:
            division = Division.objects.filter(division_i=pk).first()

            if not division:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Division not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = DivisionSerializer(division)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Division GeoJSON found.",
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