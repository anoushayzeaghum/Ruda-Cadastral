from rest_framework.views import APIView
from rest_framework.response import Response

from .services import (
    run_buffer_analysis,
    run_proximity_analysis,
    run_nearest_facility_analysis,
    run_suitability_analysis,
)


class NearestFacilityView(APIView):
    """
    GET /api/gis-analysis/nearest/?parcel_id=45&parcel_type=khasra
    """

    def get(self, request):
        parcel_id = request.query_params.get("parcel_id")
        parcel_type = request.query_params.get("parcel_type", "khasra")

        if not parcel_id:
            return Response({"error": "parcel_id is required"}, status=400)

        try:
            result = run_nearest_facility_analysis(parcel_id, parcel_type)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class BufferAnalysisView(APIView):
    """
    GET /api/gis-analysis/buffer/?parcel_id=45&parcel_type=khasra&radius=2
    """

    def get(self, request):
        parcel_id = request.query_params.get("parcel_id")
        parcel_type = request.query_params.get("parcel_type", "khasra")
        radius = request.query_params.get("radius", 1)

        if not parcel_id:
            return Response({"error": "parcel_id is required"}, status=400)

        try:
            result = run_buffer_analysis(parcel_id, parcel_type, float(radius))
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ProximityAnalysisView(APIView):
    """
    GET /api/gis-analysis/proximity/?parcel_id=45&parcel_type=khasra&limit=100
    """

    def get(self, request):
        parcel_id = request.query_params.get("parcel_id")
        parcel_type = request.query_params.get("parcel_type", "khasra")
        limit = int(request.query_params.get("limit", 100))

        if not parcel_id:
            return Response({"error": "parcel_id is required"}, status=400)

        try:
            result = run_proximity_analysis(parcel_id, parcel_type, limit)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class SuitabilityAnalysisView(APIView):
    """
    POST /api/gis-analysis/suitability/
    Body: { "parcel_id": 45, "parcel_type": "khasra", "weights": {"hospital": 0.25, ...} }
    """

    def post(self, request):
        parcel_id = request.data.get("parcel_id")
        parcel_type = request.data.get("parcel_type", "khasra")
        weights = request.data.get("weights")

        if not parcel_id:
            return Response({"error": "parcel_id is required"}, status=400)
        if not weights:
            return Response({"error": "weights are required"}, status=400)

        try:
            result = run_suitability_analysis(parcel_id, parcel_type, weights)
            return Response(result)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
