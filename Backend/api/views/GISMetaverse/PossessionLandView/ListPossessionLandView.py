from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListPossessionLandView(viewsets.ViewSet):
    queryset = PossessionLand.objects.all()
    serializer_class = PossessionLandSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            queryset = PossessionLand.objects.all()

            filter_fields = ['gid', 'district', 'tehsil', 'mouza', 'square', 'khasra', 'khasra_lab', 'award_zone', 'projects', 'l_type', 'land_owner', 'lp_name', 'date_']
            filters = {}

            for field in filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = PossessionLandSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PossessionLand records found.",
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
