from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListRtwPackageView(viewsets.ViewSet):
    queryset = RtwPackage.objects.all()
    serializer_class = RtwPackageSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            queryset = RtwPackage.objects.all()

            filter_fields = [
                "gid",
                "layer",
                "map_name",
                "name",
                "package",
                "closed",
                "ruda_phase",
            ]
            filters = {}

            for field in filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = RtwPackageSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RtwPackage records found.",
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
