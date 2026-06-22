from ..common_imports import *
from rest_framework.decorators import action

# class ListSquareView(viewsets.ViewSet):
#     queryset = Square.objects.all()
#     serializer_class = SquareSerializer
#     permission_classes = [AllowAny]

#     def list(self, request, *args, **kwargs):
#         try:
#             gid = request.query_params.get("gid")
#             mauza = request.query_params.get("mauza")
#             sq = request.query_params.get("sq")

#             if gid:
#                 obj = Square.objects.filter(gid=gid).first()

#                 if not obj:
#                     return ApiResponse(
#                         status=status.HTTP_404_NOT_FOUND,
#                         message="Square not found.",
#                         http_status=status.HTTP_404_NOT_FOUND,
#                     ).create_response()

#                 return ApiResponse(
#                     status=status.HTTP_200_OK,
#                     message="Square found.",
#                     data=SquareSerializer(obj).data,
#                     http_status=status.HTTP_200_OK,
#                 ).create_response()

#             queryset = Square.objects.all()

#             if mauza:
#                 queryset = queryset.filter(mauza__iexact=mauza)

#             if sq:
#                 queryset = queryset.filter(sq=sq)

#             serializer = SquareSerializer(queryset, many=True)

#             return ApiResponse(
#                 status=status.HTTP_200_OK,
#                 message="Squares fetched successfully.",
#                 data=serializer.data,
#                 http_status=status.HTTP_200_OK,
#             ).create_response()

#         except Exception as e:
#             return ApiResponse(
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 message="Server error.",
#                 data=str(e),
#                 http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             ).create_response()

#     @action(detail=True, methods=["get"], url_path="geojson", url_name="geojson")
#     def geojson(self, request, pk=None):
#         try:
#             obj = Square.objects.filter(gid=pk).first()

#             if not obj:
#                 return ApiResponse(
#                     status=status.HTTP_404_NOT_FOUND,
#                     message="Square not found.",
#                     http_status=status.HTTP_404_NOT_FOUND,
#                 ).create_response()

#             return ApiResponse(
#                 status=status.HTTP_200_OK,
#                 message="Square GeoJSON fetched.",
#                 data=SquareSerializer(obj).data,
#                 http_status=status.HTTP_200_OK,
#             ).create_response()

#         except Exception as e:
#             return ApiResponse(
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 message="Server error.",
#                 data=str(e),
#                 http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             ).create_response()

class ListSquareView(viewsets.ViewSet):
    queryset = Square.objects.all()
    serializer_class = SquareSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            # support both mauza name and mauza_id
            mauza = (
                request.query_params.get("mauza")
                or request.query_params.get("mauza_id")
            )

            sq = request.query_params.get("sq")

            if gid:
                obj = Square.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Square not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Square found.",
                    data=SquareSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Square.objects.all()

            if mauza:
                try:
                    mauza_int = int(mauza)
                    queryset = queryset.filter(mauza_id=mauza_int)
                except Exception:
                    queryset = queryset.filter(mauza__iexact=mauza)

            if sq:
                queryset = queryset.filter(sq=sq)

            serializer = SquareSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Squares fetched successfully.",
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