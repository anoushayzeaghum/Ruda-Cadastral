from ..common_imports import *
from rest_framework.decorators import action

class ListSocietyView(viewsets.ViewSet):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            society_id = request.query_params.get("id") or request.query_params.get("society_id")
            district = request.query_params.get("district") or request.query_params.get("dist_id")
            tehsil = request.query_params.get("tehsil") or request.query_params.get("tehsil_id")

            # Single Society
            if society_id:
                society = Society.objects.filter(gid=society_id).first()

                if not society:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Society not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = SocietySerializer(society)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Society found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by district
            elif district:
                try:
                    queryset = Society.objects.filter(dist_id=int(district))
                except:
                    queryset = Society.objects.filter(district=district)

                serializer = SocietySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Societies found for district.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by tehsil
            elif tehsil:
                try:
                    queryset = Society.objects.filter(tehsil_id=int(tehsil))
                except:
                    queryset = Society.objects.filter(tehsil=tehsil)

                serializer = SocietySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Societies found for tehsil.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All
            else:
                queryset = Society.objects.all()
                serializer = SocietySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All societies found.",
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