from ..common_imports import *


class ListPPPSchemeView(viewsets.ViewSet):
    queryset = PPPScheme.objects.all()
    serializer_class = PPPSchemeSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            scheme_nam = request.query_params.get("scheme_nam")
            ruda_st = request.query_params.get("ruda_st")

            queryset = PPPScheme.objects.all().order_by("gid")

            if gid:
                queryset = queryset.filter(gid=gid)

            if scheme_nam:
                queryset = queryset.filter(
                    scheme_nam__icontains=scheme_nam
                )

            if ruda_st:
                queryset = queryset.filter(
                    ruda_st__iexact=ruda_st
                )

            serializer = PPPSchemeSerializer(
                queryset,
                many=True
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PPP Schemes fetched successfully.",
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