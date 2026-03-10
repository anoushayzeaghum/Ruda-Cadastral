from ..common_imports import *

class ListMouzaView(viewsets.ViewSet):
    queryset = Mouza.objects.all()
    serializer_class = MouzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            mouza_id = request.query_params.get("id") or request.query_params.get("mouza_id")

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

            # Single Mouza
            if mouza_id:
                # Mouza model uses `mouza_id` as identifier in DB
                mouza = Mouza.objects.filter(mouza_id=mouza_id).first()

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
                # district can be name or numeric id
                try:
                    # numeric id
                    district_int = int(district)
                    queryset = Mouza.objects.filter(dist_id=district_int)
                except Exception:
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
                # tehsil can be name or numeric id
                try:
                    tehsil_int = int(tehsil)
                    queryset = Mouza.objects.filter(tehsil_id=tehsil_int)
                except Exception:
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