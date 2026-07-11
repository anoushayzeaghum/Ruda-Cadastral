from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListAwardedLandView(viewsets.ViewSet):
    queryset = AwardedLand.objects.all()
    serializer_class = AwardedLandSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            queryset = AwardedLand.objects.all()

            filter_fields = ['gid', 'district', 'tehsil', 'mouza', 'square', 'khasra', 'sub_khasra', 'khasra_lab', 'agri_river', 'land_type', 'date_']
            filters = {}

            for field in filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = AwardedLandSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="AwardedLand records found.",
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
