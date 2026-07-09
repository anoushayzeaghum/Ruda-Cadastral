from ..common_imports import *
from rest_framework.decorators import action


class ListAcreView(viewsets.ViewSet):
    queryset = Acre.objects.all()
    serializer_class = AcreSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza_id = request.query_params.get("mauza_id")
            mauza = request.query_params.get("mauza")
            acre_val = request.query_params.get("acre")

            if gid:
                obj = Acre.objects.select_related(
                    "district",
                    "tehsil",
                    "mauza",
                ).filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Acre not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Acre found.",
                    data=AcreSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Acre.objects.select_related(
                "district",
                "tehsil",
                "mauza",
            )

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if mauza:
                queryset = queryset.filter(
                    mauza__mauza__iexact=mauza
                )

            if acre_val:
                queryset = queryset.filter(acre=acre_val)

            serializer = AcreSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Acre list fetched successfully.",
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