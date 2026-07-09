import os
import zipfile
import tempfile
import shutil
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.shapefiles.import_khasra import run_khasra_import


@csrf_exempt
def import_khasra_shapefile(request):
    if request.method != "POST":
        return JsonResponse({"message": "Only POST allowed"}, status=405)

    file = request.FILES.get("file")
    if not file:
        return JsonResponse({"message": "No file uploaded"}, status=400)

    tmpdir = tempfile.mkdtemp()

    try:
        zip_path = os.path.join(tmpdir, file.name)

        # save zip
        with open(zip_path, "wb") as f:
            for chunk in file.chunks():
                f.write(chunk)

        # extract
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # find shapefile
        shp_file = None
        for root, _, files in os.walk(tmpdir):
            for f in files:
                if f.endswith(".shp"):
                    shp_file = os.path.join(root, f)
                    break

        if not shp_file:
            return JsonResponse({"message": "No .shp file found"}, status=400)

        # IMPORT
        run_khasra_import(shp_file)

        return JsonResponse({"message": "Khasra imported successfully"})

    finally:
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass