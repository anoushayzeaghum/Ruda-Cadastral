from ..common_imports import *

class ListKhasraView(viewsets.ViewSet):
    queryset = Khasra.objects.all()
    serializer_class = KhasraSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            khasra_id = request.query_params.get("id")
            mouza = request.query_params.get("mouza")
            murabba = request.query_params.get("m")
            tehsil = request.query_params.get("tehsil")

            # Single khasra
            if khasra_id:
                khasra = Khasra.objects.filter(id=khasra_id).first()

                if not khasra:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Khasra not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = KhasraSerializer(khasra)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasra found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by Mouza
            elif mouza:
                queryset = Khasra.objects.filter(mouza=mouza)

                serializer = KhasraSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasras found for Mouza.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by Murabba
            elif murabba:
                queryset = Khasra.objects.filter(m=murabba)

                serializer = KhasraSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasras found for Murabba.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by Tehsil
            elif tehsil:
                queryset = Khasra.objects.filter(tehsil=tehsil)

                serializer = KhasraSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasras found for Tehsil.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Return all
            else:
                queryset = Khasra.objects.all()

                serializer = KhasraSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All Khasras found.",
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