from ..common_imports import *

class ListTehsilView(viewsets.ViewSet):

    queryset = Tehsil.objects.all()
    serializer_class = TehsilSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            district_i = request.query_params.get("district_i")
            tehsil_id = request.query_params.get("id")

            if tehsil_id:

                tehsil = Tehsil.objects.filter(id=tehsil_id).first()

                if not tehsil:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Tehsil not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = TehsilSerializer(tehsil)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Tehsil found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif district_i:

                queryset = Tehsil.objects.filter(district_i=district_i)

                serializer = TehsilSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Tehsils found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Tehsil.objects.all()

            serializer = TehsilSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="All tehsils found.",
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