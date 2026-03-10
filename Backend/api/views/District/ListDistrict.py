from ..common_imports import *

class ListDistrictView(viewsets.ViewSet):

    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            division_i = request.query_params.get("division_i")
            district_id = request.query_params.get("id")

            if district_id:

                district = District.objects.filter(id=district_id).first()

                if not district:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="District not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = DistrictSerializer(district)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="District found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif division_i:

                queryset = District.objects.filter(division_i=division_i)

                serializer = DistrictSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Districts found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = District.objects.all()

            serializer = DistrictSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="All districts found.",
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