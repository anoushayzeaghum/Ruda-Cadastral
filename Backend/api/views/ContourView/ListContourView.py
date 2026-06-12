from ..common_imports import *

class ListContourView(viewsets.ViewSet):
    queryset = Contour.objects.all()
    serializer_class = ContourSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            contour_id = request.query_params.get("id")
            society_id = request.query_params.get("society_id")
            mauza_id = request.query_params.get("mauza_id")
            dist_id = request.query_params.get("dist_id")
            tehsil_id = request.query_params.get("tehsil_id")

            # Single record
            if contour_id:
                obj = Contour.objects.filter(gid=contour_id).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Contour not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = ContourSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Contour found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Base queryset
            queryset = Contour.objects.all()

            if society_id:
                queryset = queryset.filter(society_id=society_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if dist_id:
                queryset = queryset.filter(dist_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = ContourSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Contour data fetched successfully.",
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