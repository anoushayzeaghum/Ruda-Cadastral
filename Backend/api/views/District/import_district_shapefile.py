import os
import zipfile
import tempfile
import shutil
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.shapefiles.import_district import run_shapefile_import


@csrf_exempt
def import_district_shapefile(request):
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

        # extract zip
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # find .shp
        shp_file = None
        for root, _, files in os.walk(tmpdir):
            for f in files:
                if f.endswith(".shp"):
                    shp_file = os.path.join(root, f)
                    break

        if not shp_file:
            return JsonResponse({"message": "No .shp file found"}, status=400)

        # IMPORT
        run_shapefile_import(shp_file)

        return JsonResponse({"message": "Imported successfully"})

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=400)

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)