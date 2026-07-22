from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache


@method_decorator(cache_page(60 * 10), name="list")
class ListMpPrincipleZoningView(viewsets.ViewSet):

    permission_classes = [AllowAny]

    filter_fields = [
        "area225a",
        "zoning_cat",
        "area_sqft",
    ]


    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")


            # =========================
            # SINGLE FEATURE
            # =========================
            if gid:

                cache_key = f"mp_zoning_{gid}"

                cached = cache.get(cache_key)

                if cached:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="MpPrincipleZoning found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()


                record = (
                    MpPrincipleZoning.objects
                    .only(
                        "gid",
                        "area225a",
                        "zoning_cat",
                        "area_sqft",
                        "geom",
                    )
                    .filter(gid=gid)
                    .first()
                )


                if not record:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="MpPrincipleZoning not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()


                data = MpPrincipleZoningSerializer(record).data


                cache.set(
                    cache_key,
                    data,
                    60 * 60
                )


                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="MpPrincipleZoning found.",
                    data=data,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            # =========================
            # FILTERS
            # =========================

            filters = {}

            for field in self.filter_fields:

                value = request.query_params.get(field)

                if value not in [None, ""]:
                    filters[field] = value



            queryset = (
                MpPrincipleZoning.objects
                .only(
                    "gid",
                    "area225a",
                    "zoning_cat",
                    "area_sqft",
                    "geom",
                )
                .filter(**filters)
            )


            cache_key = (
                "mp_principle_zoning_"
                + str(sorted(filters.items()))
            )


            cached = cache.get(cache_key)


            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Cached records.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            serializer = MpPrincipleZoningSerializer(
                queryset,
                many=True
            )


            data = serializer.data


            cache.set(
                cache_key,
                data,
                60 * 30
            )


            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MpPrincipleZoning records found.",
                data=data,
                http_status=status.HTTP_200_OK,
            ).create_response()



        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()



    # =========================
    # GEOJSON SINGLE
    # =========================

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson"
    )
    def geojson(self, request, pk=None):

        try:

            cache_key = f"mp_geojson_{pk}"

            cached = cache.get(cache_key)


            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="GeoJSON found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            record = (
                MpPrincipleZoning.objects
                .only(
                    "gid",
                    "area225a",
                    "zoning_cat",
                    "area_sqft",
                    "geom",
                )
                .filter(gid=pk)
                .first()
            )


            if not record:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()



            data = MpPrincipleZoningSerializer(record).data


            cache.set(
                cache_key,
                data,
                3600
            )


            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON found.",
                data=data,
                http_status=status.HTTP_200_OK,
            ).create_response()



        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()