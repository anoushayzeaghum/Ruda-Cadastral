from rest_framework import parsers, viewsets
from rest_framework.permissions import AllowAny

from api.models import KmzPrintLog
from api.serializers import KmzPrintLogSerializer


class KmzPrintLogViewSet(viewsets.ModelViewSet):
    queryset = KmzPrintLog.objects.all()
    serializer_class = KmzPrintLogSerializer
    permission_classes = [AllowAny]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        serializer.save()
