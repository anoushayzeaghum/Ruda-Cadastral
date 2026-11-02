import os
import zipfile
import tempfile
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.shapefiles.RudaProjectsShapefiles.import_spotlevel import run_shapefile_import


@csrf_exempt
def import_spotlevel_shapefile(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    upload = request.FILES.get("file")
    project_id = request.POST.get("project_id") or request.GET.get("project_id")
    replace = str(request.POST.get("replace", "false")).lower() in ("true", "1", "yes")
    if not upload:
        return JsonResponse({"message": "No shapefile ZIP uploaded in field 'file'."}, status=400)
    if not project_id:
        return JsonResponse({"message": "project_id is required. Choose the RUDA project for these Spot Levels."}, status=400)
    if not str(project_id).isdigit():
        return JsonResponse({"message": "project_id must be a positive integer."}, status=400)

    with tempfile.TemporaryDirectory() as tempdir:
        archive_path = Path(tempdir) / "spot_level_upload.zip"
        with archive_path.open("wb") as output:
            for chunk in upload.chunks():
                output.write(chunk)
        try:
            with zipfile.ZipFile(archive_path, "r") as archive:
                dest = Path(tempdir) / "shape"
                dest.mkdir()
                for member in archive.infolist():
                    name = Path(member.filename.replace("\\", "/"))
                    if name.is_absolute() or ".." in name.parts:
                        raise ValueError("Unsafe ZIP path in uploaded archive.")
                    if member.is_dir():
                        continue
                    if name.suffix.lower() not in (".shp", ".dbf", ".shx", ".prj", ".cpg", ".sbn", ".sbx", ".xml"):
                        continue
                    target = dest / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(member) as inp, target.open("wb") as out:
                        import shutil
                        shutil.copyfileobj(inp, out)
                candidates = list(dest.rglob("*.shp"))
                if len(candidates) != 1:
                    raise ValueError("ZIP must contain exactly one .shp file with .dbf, .shx and .prj.")
                shp = candidates[0]
                for extension in (".dbf", ".shx", ".prj"):
                    if not shp.with_suffix(extension).is_file():
                        raise ValueError(f"Missing {extension} file alongside {shp.name}.")

                result = run_shapefile_import(str(shp), int(project_id), replace=replace)
                return JsonResponse({"message": "Spot Levels imported successfully", **result})
        except (ValueError, zipfile.BadZipFile) as exc:
            return JsonResponse({"message": str(exc)}, status=400)
        except Exception as exc:
            # Return generic failure to the client; log the internal error.
            import logging
            logging.getLogger(__name__).exception("Spot Level import failed")
            return JsonResponse({"message": "Spot Level import failed. Check server logs."}, status=500)
