from ..common_imports import *

class ListMasterPlanView(viewsets.ViewSet):
    queryset = MasterPlan.objects.all()
    serializer_class = MasterPlanSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            mp_id = request.query_params.get("id")
            society_id = request.query_params.get("society_id")
            mauza_id = request.query_params.get("mauza_id")
            dist_id = request.query_params.get("dist_id")
            tehsil_id = request.query_params.get("tehsil_id")

            # Single record
            if mp_id:
                obj = MasterPlan.objects.filter(gid=mp_id).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="MasterPlan not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MasterPlanSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="MasterPlan found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filters
            queryset = MasterPlan.objects.all()

            if society_id:
                queryset = queryset.filter(society_id=society_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if dist_id:
                queryset = queryset.filter(dist_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = MasterPlanSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MasterPlan data fetched successfully.",
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