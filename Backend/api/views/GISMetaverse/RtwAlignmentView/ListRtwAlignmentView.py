from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListRtwAlignmentView(viewsets.ViewSet):
    queryset = RtwAlignment.objects.all()
    serializer_class = RtwAlignmentSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            queryset = RtwAlignment.objects.all()

            filter_fields = ['gid', 'package', 'length', 'date_']
            filters = {}

            for field in filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = RtwAlignmentSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RtwAlignment records found.",
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
