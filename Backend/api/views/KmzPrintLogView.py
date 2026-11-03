import os
from django.http import FileResponse, Http404
from rest_framework.decorators import action
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

    # Stream stored files rather than converting entire KMZ/PDF files to
    # Blob/ArrayBuffer in the browser. This also avoids opening a KMZ as a tab.
    def _stored_file_response(self, obj, field, content_type, as_attachment):
        stored = getattr(obj, field, None)
        if not stored or not stored.name:
            raise Http404("The saved file is unavailable.")
        try:
            stream = stored.storage.open(stored.name, "rb")
        except (OSError, ValueError, FileNotFoundError) as exc:
            raise Http404("The saved file could not be found.") from exc

        filename = os.path.basename(stored.name)
        response = FileResponse(
            stream,
            as_attachment=as_attachment,
            filename=filename,
            content_type=content_type,
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response

    @action(detail=True, methods=["get"], url_path="view-pdf")
    def view_pdf(self, request, pk=None):
        return self._stored_file_response(
            self.get_object(), "report_file", "application/pdf", False
        )

    @action(detail=True, methods=["get"], url_path="download-pdf")
    def download_pdf(self, request, pk=None):
        return self._stored_file_response(
            self.get_object(), "report_file", "application/pdf", True
        )

    @action(detail=True, methods=["get"], url_path="download-kmz")
    def download_kmz(self, request, pk=None):
        return self._stored_file_response(
            self.get_object(), "file", "application/vnd.google-earth.kmz", True
        )
