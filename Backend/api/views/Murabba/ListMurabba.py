from ..common_imports import *

class ListMurabbaView(viewsets.ViewSet):
    queryset = Murabba.objects.all()
    serializer_class = MurabbaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            murabba_id = request.query_params.get("id")
            mouza = request.query_params.get("mouza")
            tehsil = request.query_params.get("tehsil")

            # Single murabba
            if murabba_id:
                murabba = Murabba.objects.filter(id=murabba_id).first()

                if not murabba:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Murabba not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MurabbaSerializer(murabba)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Murabba found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by Mouza
            elif mouza:
                queryset = Murabba.objects.filter(mouza=mouza)

                serializer = MurabbaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Murabbas found for Mouza.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by Tehsil
            elif tehsil:
                queryset = Murabba.objects.filter(tehsil=tehsil)

                serializer = MurabbaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Murabbas found for Tehsil.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All Murabbas
            else:
                queryset = Murabba.objects.all()

                serializer = MurabbaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All Murabbas found.",
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