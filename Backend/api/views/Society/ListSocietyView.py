from ..common_imports import *
from rest_framework.decorators import action


class ListSocietyView(viewsets.ViewSet):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            record_id = request.query_params.get("id") or request.query_params.get("gid")
            society_id = request.query_params.get("society_id")
            mauza_id = request.query_params.get("mauza_id")
            mauza = request.query_params.get("mauza")
            district = request.query_params.get("district") or request.query_params.get("dist_id")
            tehsil = request.query_params.get("tehsil") or request.query_params.get("tehsil_id")

            if record_id:
                society = Society.objects.filter(gid=record_id).first()

                if not society:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Society not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = SocietySerializer(society)
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Society found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Society.objects.all()

            if society_id:
                queryset = queryset.filter(society_id=society_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if mauza:
                queryset = queryset.filter(mauza__iexact=mauza)

            if district:
                try:
                    queryset = queryset.filter(dist_id=int(district))
                except (TypeError, ValueError):
                    queryset = queryset.filter(district__iexact=district)

            if tehsil:
                try:
                    queryset = queryset.filter(tehsil_id=int(tehsil))
                except (TypeError, ValueError):
                    queryset = queryset.filter(tehsil__iexact=tehsil)

            serializer = SocietySerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Societies fetched successfully.",
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

    @action(detail=True, methods=["get"], url_path="geojson")
    def geojson(self, request, pk=None):
        try:
            society = Society.objects.filter(gid=pk).first()

            if not society:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Society boundary not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = SocietySerializer(society)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Society boundary fetched successfully.",
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
