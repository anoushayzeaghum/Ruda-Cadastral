"""HTTP ZIP-upload wrapper for the Trijunction shapefile importer."""

from pathlib import Path
import gc
import tempfile
import shutil
import time
import zipfile

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.shapefiles.import_trijunction import ShapefileImportError, run_trijunction_import


def _safe_extract(archive, destination):
    destination = Path(destination).resolve()
    for member in archive.infolist():
        member_path = (destination / member.filename).resolve()
        if member_path != destination and destination not in member_path.parents:
            raise ShapefileImportError("ZIP contains an unsafe file path.")
    archive.extractall(destination)


def _extract_shapefile(uploaded_file, work_dir):
    if not uploaded_file:
        raise ShapefileImportError("Please upload a ZIP file.")
    if not str(uploaded_file.name).lower().endswith(".zip"):
        raise ShapefileImportError("Only ZIP files containing a shapefile are accepted.")

    zip_path = Path(work_dir) / "upload.zip"
    with zip_path.open("wb") as target:
        for chunk in uploaded_file.chunks():
            target.write(chunk)

    try:
        with zipfile.ZipFile(zip_path) as archive:
            _safe_extract(archive, work_dir)
    except zipfile.BadZipFile as exc:
        raise ShapefileImportError("The uploaded file is not a valid ZIP archive.") from exc

    shapefiles = [p for p in Path(work_dir).rglob("*.shp") if p.is_file()]
    if not shapefiles:
        raise ShapefileImportError("ZIP does not contain a .shp file.")
    if len(shapefiles) > 1:
        names = ", ".join(p.name for p in shapefiles[:8])
        raise ShapefileImportError(
            f"ZIP must contain exactly one shapefile. Found {len(shapefiles)}: {names}"
        )

    shp_path = shapefiles[0]
    stem = shp_path.with_suffix("")
    missing = [ext for ext in (".shx", ".dbf") if not stem.with_suffix(ext).exists()]
    if missing:
        raise ShapefileImportError(
            "Shapefile is incomplete. Missing: " + ", ".join(missing)
        )
    return shp_path


def _response(message, imported=0, http_status=status.HTTP_200_OK):
    return Response(
        {
            "status": http_status,
            "message": message,
            "data": {"imported": imported},
            "error_traceback": None,
        },
        status=http_status,
    )


def _cleanup_work_dir(work_dir, retries=5, delay=0.20):
    """
    Best-effort Windows cleanup.

    GDAL or antivirus software can briefly keep .dbf/.shx files open. Cleanup
    failure must not turn an otherwise successful database import into HTTP 400.
    """
    if not work_dir:
        return

    gc.collect()

    for _ in range(retries):
        try:
            shutil.rmtree(work_dir)
            return
        except FileNotFoundError:
            return
        except (PermissionError, OSError):
            gc.collect()
            time.sleep(delay)

    shutil.rmtree(work_dir, ignore_errors=True)


@api_view(["POST"])
def import_trijunction_shapefile(request):
    temp_dir = tempfile.mkdtemp(prefix="ruda_trijunction_import_")

    try:
        shp_path = _extract_shapefile(request.FILES.get("file"), temp_dir)
        imported = run_trijunction_import(shp_path)
        return _response("Trijunction imported successfully.", imported=imported)

    except ShapefileImportError as exc:
        return _response(str(exc), http_status=status.HTTP_400_BAD_REQUEST)

    except Exception as exc:
        return _response(
            f"Trijunction import failed: {exc}",
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    finally:
        _cleanup_work_dir(temp_dir)
