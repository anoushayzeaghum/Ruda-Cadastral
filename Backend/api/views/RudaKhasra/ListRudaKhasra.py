from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListRudaKhasraView(viewsets.ViewSet):
    queryset = RudaKhasra.objects.all()
    serializer_class = RudaKhasraSerializer
    permission_classes = [AllowAny]

    @staticmethod
    def _optional_filter(request, name):
        value = request.query_params.get(name)
        return value if value not in (None, "") else None

    def _fetch_feature_collection(
        self,
        *,
        gid=None,
        mauza_id=None,
        tehsil_id=None,
        dist_id=None,
        full_precision=False,
    ):
        """
        Return map-ready GeoJSON directly from PostGIS.

        This avoids GeoFeatureModelSerializer overhead, related-object access,
        and Python-side conversion of large GEOS geometry objects. Seven
        decimal places preserve roughly centimetre-level coordinate precision
        in EPSG:4326 while reducing the response size. Use full_precision=1
        when the unsimplified coordinate precision is specifically required.
        """
        where_parts = []
        filter_params = []

        if gid is not None:
            where_parts.append('"gid" = %s')
            filter_params.append(gid)

        if mauza_id is not None:
            where_parts.append('"mauza_id" = %s')
            filter_params.append(mauza_id)

        if tehsil_id is not None:
            where_parts.append('"tehsil_id" = %s')
            filter_params.append(tehsil_id)

        if dist_id is not None:
            where_parts.append('"dist_id" = %s')
            filter_params.append(dist_id)

        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
        precision = 15 if full_precision else 7

        feature_sql = f"""
            SELECT
                "gid",
                "__gid",
                "district",
                "tehsil",
                "mauza",
                "remarks",
                "area_sqft",
                "shape_leng",
                "shape_area",
                "dist_id",
                "tehsil_id",
                "mauza_id",
                "kc",
                "kc_id",
                "pc",
                "pc_id",
                "hadbust_no",
                "asse_cir",
                "type",
                "karam",
                "sq",
                "kh",
                "sk",
                "join_shp",
                "khasra_id",
                "khewat_id",
                "khatoni_no",
                "dc_rate",
                "b",
                ST_AsGeoJSON(ST_Force2D("geom"), %s)::json
            FROM "ruda_khasra"
            {where_sql}
            ORDER BY "gid"
        """

        extent_sql = f"""
            SELECT
                ST_XMin(extent)::float8,
                ST_YMin(extent)::float8,
                ST_XMax(extent)::float8,
                ST_YMax(extent)::float8
            FROM (
                SELECT ST_Extent(ST_Force2D("geom")) AS extent
                FROM "ruda_khasra"
                {where_sql}
            ) AS bounds
        """

        with connection.cursor() as cursor:
            cursor.execute(feature_sql, [precision, *filter_params])
            rows = cursor.fetchall()

            cursor.execute(extent_sql, filter_params)
            extent_row = cursor.fetchone()

        features = []

        for row in rows:
            features.append(
                {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[29],
                    "properties": {
                        "gid": row[0],
                        "__gid": row[1],
                        "district_text": row[2],
                        "district_name": row[2],
                        "tehsil_text": row[3],
                        "tehsil_name": row[3],
                        "mauza_text": row[4],
                        "mauza_name": row[4],
                        "remarks": row[5],
                        "area_sqft": row[6],
                        "shape_leng": row[7],
                        "shape_area": row[8],
                        "dist_id": row[9],
                        "district_id": row[9],
                        "tehsil_id": row[10],
                        "mauza_id": row[11],
                        "kc": row[12],
                        "kc_id": row[13],
                        "pc": row[14],
                        "pc_id": row[15],
                        "hadbust_no": row[16],
                        "asse_cir": row[17],
                        "type": row[18],
                        "karam": float(row[19]) if row[19] is not None else None,
                        "sq": row[20],
                        "kh": row[21],
                        "sk": row[22],
                        "join_shp": row[23],
                        "khasra_id": row[24],
                        "khewat_id": row[25],
                        "khatoni_no": row[26],
                        "dc_rate": row[27],
                        "b": row[28],
                    },
                }
            )

        feature_collection = {
            "type": "FeatureCollection",
            "features": features,
        }

        if extent_row and all(value is not None for value in extent_row):
            feature_collection["bbox"] = list(extent_row)

        return feature_collection

    def list(self, request, *args, **kwargs):
        try:
            gid = (
                self._optional_filter(request, "gid")
                or self._optional_filter(request, "id")
            )
            mauza_id = self._optional_filter(request, "mauza_id")
            tehsil_id = self._optional_filter(request, "tehsil_id")
            dist_id = self._optional_filter(request, "dist_id")
            full_precision = request.query_params.get("full_precision") in {
                "1",
                "true",
                "True",
            }

            feature_collection = self._fetch_feature_collection(
                gid=gid,
                mauza_id=mauza_id,
                tehsil_id=tehsil_id,
                dist_id=dist_id,
                full_precision=full_precision,
            )

            if gid:
                if not feature_collection["features"]:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="RudaKhasra not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaKhasra found.",
                    data=feature_collection["features"][0],
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaKhasra data fetched successfully.",
                data=feature_collection,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            print("\n========== RudaKhasra ERROR ==========")
            print(traceback.format_exc())
            print("=======================================\n")

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):
        cache_key = f"ruda_khasra_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached is not None:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaKhasra GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:
            feature_collection = self._fetch_feature_collection(gid=pk)

            if not feature_collection["features"]:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="RudaKhasra not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = feature_collection["features"][0]
            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaKhasra GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
