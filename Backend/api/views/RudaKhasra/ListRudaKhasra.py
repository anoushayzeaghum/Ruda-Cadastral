from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.http import HttpResponse


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
        detail=False,
        methods=["get"],
        url_path="extent",
        url_name="extent",
    )
    def extent(self, request):
        """Return only the full table extent and count, never all geometries."""
        cache_key = "ruda_khasra_extent_v1"
        cached_extent = cache.get(cache_key)

        if cached_extent is None:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        ST_XMin(extent)::float8,
                        ST_YMin(extent)::float8,
                        ST_XMax(extent)::float8,
                        ST_YMax(extent)::float8,
                        feature_count::bigint
                    FROM (
                        SELECT
                            ST_Extent(ST_Force2D("geom")) AS extent,
                            COUNT(*) AS feature_count
                        FROM "ruda_khasra"
                        WHERE "geom" IS NOT NULL
                          AND NOT ST_IsEmpty("geom")
                    ) AS layer_extent
                    """
                )
                row = cursor.fetchone()

            bbox = list(row[:4]) if row and all(v is not None for v in row[:4]) else []
            cached_extent = {
                "bbox": bbox,
                "count": int(row[4]) if row and row[4] is not None else 0,
                "min_zoom": 11,
            }
            cache.set(cache_key, cached_extent, 60 * 60 * 24)

        return ApiResponse(
            status=status.HTTP_200_OK,
            message="RudaKhasra extent fetched successfully.",
            data=cached_extent,
            http_status=status.HTTP_200_OK,
        ).create_response()

    @action(
        detail=False,
        methods=["get"],
        url_path=r"tiles/(?P<z>\d+)/(?P<x>\d+)/(?P<y>\d+)",
        url_name="tiles",
    )
    def tiles(self, request, z=None, x=None, y=None):
        """
        Serve RUDA Khasra as Mapbox Vector Tiles.

        Only features intersecting the requested map tile are read from
        PostGIS. This keeps the browser responsive even though the source table
        contains roughly 233,000 polygons.
        """
        try:
            z = int(z)
            x = int(x)
            y = int(y)
        except (TypeError, ValueError):
            return HttpResponse(status=400)

        max_tile_index = (1 << z) - 1 if 0 <= z <= 18 else -1
        if (
            z < 11
            or z > 18
            or x < 0
            or y < 0
            or x > max_tile_index
            or y > max_tile_index
        ):
            return HttpResponse(
                b"",
                content_type="application/vnd.mapbox-vector-tile",
            )

        tile_cache_key = f"ruda_khasra_mvt_v3_{z}_{x}_{y}"
        cached_tile = cache.get(tile_cache_key)
        if cached_tile is not None:
            response = HttpResponse(
                cached_tile,
                content_type="application/vnd.mapbox-vector-tile",
            )
            response["Cache-Control"] = "public, max-age=3600"
            return response

        # The frontend starts this source at zoom 11. Geometry simplification
        # is performed in Web Mercator metres before MVT clipping.
        if z <= 11:
            tolerance = 1.5
        elif z <= 13:
            tolerance = 0.45
        elif z <= 15:
            tolerance = 0.12
        else:
            tolerance = 0.0

        sql = """
            WITH
            tile_bounds AS (
                SELECT
                    tile_3857 AS geom_3857,
                    ST_Transform(tile_3857, 4326) AS geom_4326
                FROM (
                    SELECT ST_TileEnvelope(%s, %s, %s) AS tile_3857
                ) AS tile
            ),
            candidates AS (
                SELECT
                    k."gid",
                    k."__gid",
                    k."district" AS district_text,
                    k."tehsil" AS tehsil_text,
                    k."mauza" AS mauza_text,
                    k."remarks",
                    k."area_sqft",
                    k."shape_leng",
                    k."shape_area",
                    k."dist_id",
                    k."tehsil_id",
                    k."mauza_id",
                    k."kc",
                    k."kc_id",
                    k."pc",
                    k."pc_id",
                    k."hadbust_no",
                    k."asse_cir",
                    k."type",
                    k."karam"::float8 AS karam,
                    k."sq",
                    k."kh",
                    k."sk",
                    k."join_shp",
                    k."khasra_id",
                    k."khewat_id",
                    k."khatoni_no",
                    k."dc_rate",
                    k."b",
                    CASE
                        WHEN %s > 0 THEN ST_SimplifyPreserveTopology(
                            ST_Transform(ST_Force2D(k."geom"), 3857),
                            %s
                        )
                        ELSE ST_Transform(ST_Force2D(k."geom"), 3857)
                    END AS geom_3857,
                    tb.geom_3857 AS tile_geom
                FROM "ruda_khasra" AS k
                CROSS JOIN tile_bounds AS tb
                WHERE k."geom" IS NOT NULL
                  AND NOT ST_IsEmpty(k."geom")
                  AND k."geom" && tb.geom_4326
                  AND ST_Intersects(k."geom", tb.geom_4326)
            ),
            mvt_rows AS (
                SELECT
                    "gid",
                    "__gid",
                    district_text,
                    district_text AS district_name,
                    tehsil_text,
                    tehsil_text AS tehsil_name,
                    mauza_text,
                    mauza_text AS mauza_name,
                    "remarks",
                    "area_sqft",
                    "shape_leng",
                    "shape_area",
                    "dist_id",
                    "dist_id" AS district_id,
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
                    ST_AsMVTGeom(
                        geom_3857,
                        tile_geom,
                        4096,
                        64,
                        true
                    ) AS geom
                FROM candidates
                WHERE geom_3857 IS NOT NULL
                  AND NOT ST_IsEmpty(geom_3857)
            )
            SELECT COALESCE(
                ST_AsMVT(mvt_rows, 'ruda_khasra', 4096, 'geom', 'gid'),
                ''::bytea
            )
            FROM mvt_rows
        """

        with connection.cursor() as cursor:
            cursor.execute(sql, [z, x, y, tolerance, tolerance])
            row = cursor.fetchone()

        tile = bytes(row[0]) if row and row[0] is not None else b""
        cache.set(tile_cache_key, tile, 60 * 60)

        response = HttpResponse(
            tile,
            content_type="application/vnd.mapbox-vector-tile",
        )
        response["Cache-Control"] = "public, max-age=3600"
        return response

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
