from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache



@method_decorator(cache_page(60 * 10), name="list")
class ListExistingForestView(viewsets.ViewSet):

    permission_classes = [AllowAny]


    filter_fields = [
        "name",
        "type",
        "source",
        "lu_type",
        "status",
        "comments",
        "area_sqfee",
        "area_acre",
        "area_225ac",
    ]



    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")


            # =========================================
            # SINGLE FEATURE
            # =========================================

            if gid:


                cache_key = f"existing_forest_{gid}"

                cached = cache.get(cache_key)


                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="ExistingForest found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()



                record = (
                    ExistingForest.objects
                    .only(
                        "gid",
                        "name",
                        "type",
                        "source",
                        "lu_type",
                        "status",
                        "comments",
                        "area_sqfee",
                        "area_acre",
                        "area_225ac",
                        "geom",
                    )
                    .filter(gid=gid)
                    .first()
                )



                if not record:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="ExistingForest not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()



                data = ExistingForestSerializer(record).data



                cache.set(
                    cache_key,
                    data,
                    3600
                )



                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ExistingForest found.",
                    data=data,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            # =========================================
            # FILTER LIST
            # =========================================


            filters = {}


            for field in self.filter_fields:

                value = request.query_params.get(field)

                if value not in [None, ""]:

                    filters[field] = value



            cache_key = (
                "existing_forest_"
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




            queryset = (

                ExistingForest.objects

                .only(
                    "gid",
                    "name",
                    "type",
                    "source",
                    "lu_type",
                    "status",
                    "comments",
                    "area_sqfee",
                    "area_acre",
                    "area_225ac",
                    "geom",
                )

                .filter(**filters)

            )



            serializer = ExistingForestSerializer(
                queryset,
                many=True
            )


            data = serializer.data



            cache.set(
                cache_key,
                data,
                1800
            )



            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ExistingForest records found.",
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




    # =========================================
    # GEOJSON SINGLE
    # =========================================


    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):

        try:


            cache_key = f"existing_forest_geojson_{pk}"


            cached = cache.get(cache_key)



            if cached:


                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ExistingForest GeoJSON found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()




            record = (

                ExistingForest.objects

                .only(
                    "gid",
                    "name",
                    "type",
                    "source",
                    "lu_type",
                    "status",
                    "comments",
                    "area_sqfee",
                    "area_acre",
                    "area_225ac",
                    "geom",
                )

                .filter(gid=pk)

                .first()

            )



            if not record:


                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="ExistingForest not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()



            data = ExistingForestSerializer(record).data



            cache.set(
                cache_key,
                data,
                3600
            )



            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ExistingForest GeoJSON found.",
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