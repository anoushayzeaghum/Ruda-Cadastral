from ..common_imports import *

class ListMouzaView(viewsets.ViewSet):
    queryset = Mouza.objects.all()
    serializer_class = MouzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            mouza_id = request.query_params.get("id")
            district = request.query_params.get("district")
            tehsil = request.query_params.get("tehsil")

            # Single Mouza
            if mouza_id:
                mouza = Mouza.objects.filter(id=mouza_id).first()

                if not mouza:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Mouza not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MouzaSerializer(mouza)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mouza found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by district
            elif district:
                queryset = Mouza.objects.filter(district=district)

                serializer = MouzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mouzas found for district.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by tehsil
            elif tehsil:
                queryset = Mouza.objects.filter(tehsil=tehsil)

                serializer = MouzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mouzas found for tehsil.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All Mouzas
            else:
                queryset = Mouza.objects.all()

                serializer = MouzaSerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All Mouzas found.",
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