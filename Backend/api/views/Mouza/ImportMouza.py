from ..common_imports import *
import zipfile
import tempfile
import os
# from osgeo import ogr, osr
from django.contrib.gis.geos import GEOSGeometry
from django.db import transaction


class ImportMouzaView(viewsets.ViewSet):
    """Import Mouza features from an uploaded ZIP containing a shapefile.

    Expects multipart/form-data with:
      - file: ZIP archive containing .shp/.shx/.dbf/.prj
      - tehsil: (optional) tehsil name to assign to imported records
      - mouza: (optional) mouza name to assign to imported records
    """

    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        tehsil_override = request.POST.get("tehsil")
        mouza_override = request.POST.get("mouza")

        if not uploaded_file:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="No file uploaded.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        # Save to temp file
        tmpdir = tempfile.mkdtemp()
        try:
            zip_path = os.path.join(tmpdir, "upload.zip")
            with open(zip_path, "wb") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)

            with zipfile.ZipFile(zip_path, "r") as z:
                z.extractall(tmpdir)

            # find .shp
            shp_path = None
            for fn in os.listdir(tmpdir):
                if fn.lower().endswith(".shp"):
                    shp_path = os.path.join(tmpdir, fn)
                    break

            if not shp_path:
                return ApiResponse(
                    status=status.HTTP_400_BAD_REQUEST,
                    message="No .shp file found inside ZIP.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                ).create_response()

            # Open with OGR and check projection
            ds = ogr.Open(shp_path)
            if ds is None:
                raise Exception("Failed to open shapefile")

            layer = ds.GetLayer(0)
            spatial_ref = layer.GetSpatialRef()
            if spatial_ref is not None:
                target = osr.SpatialReference()
                target.ImportFromEPSG(4326)
                if not spatial_ref.IsSame(target):
                    return ApiResponse(
                        status=status.HTTP_400_BAD_REQUEST,
                        message="Shapefile projection must be WGS84 (EPSG:4326).",
                        http_status=status.HTTP_400_BAD_REQUEST,
                    ).create_response()

            # Required attribute fields
            required = ["mouza_id"]
            layer_defn = layer.GetLayerDefn()
            field_names = [layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]

            missing = [f for f in required if f not in [n.lower() for n in field_names]]
            if missing:
                return ApiResponse(
                    status=status.HTTP_400_BAD_REQUEST,
                    message=f"Shapefile missing required fields: {', '.join(missing)}",
                    http_status=status.HTTP_400_BAD_REQUEST,
                ).create_response()

            created = []
            from api.models import Mouza as MouzaModel

            with transaction.atomic():
                for feat in layer:
                    geom = feat.GetGeometryRef()
                    if geom is None:
                        continue

                    # export to WKB and create GEOS geometry
                    wkb = geom.ExportToWkb()
                    g = GEOSGeometry(bytes(wkb), srid=4326)

                    # attributes (case-insensitive keys)
                    props = {}
                    for name in field_names:
                        val = feat.GetField(name)
                        props[name.lower()] = val

                    mouza_id_val = props.get("mouza_id")
                    # allow override values from form
                    tehsil_val = tehsil_override or props.get("tehsil")
                    mouza_val = mouza_override or props.get("mouza")
                    district_val = props.get("district")
                    dist_id_val = props.get("dist_id") or props.get("disti") or props.get("dist_id")
                    tehsil_id_val = props.get("tehsil_id")

                    if mouza_id_val is None:
                        # skip features without id
                        continue

                    # Upsert (merge) based on mouza_id
                    mouza_id_float = float(mouza_id_val)
                    existing = MouzaModel.objects.filter(mouza_id=mouza_id_float).first()

                    if existing:
                        # update existing record
                        existing.district = district_val or existing.district
                        if dist_id_val not in (None, ""):
                            try:
                                existing.dist_id = float(dist_id_val)
                            except Exception:
                                pass
                        existing.tehsil = tehsil_val or existing.tehsil
                        if tehsil_id_val not in (None, ""):
                            try:
                                existing.tehsil_id = float(tehsil_id_val)
                            except Exception:
                                pass
                        existing.mouza = mouza_val or existing.mouza
                        existing.geom = g
                        existing.save()
                        created.append(existing.id)
                    else:
                        mouza_obj = MouzaModel(
                            district=district_val or "",
                            dist_id=float(dist_id_val) if dist_id_val not in (None, "") else None,
                            tehsil=tehsil_val or "",
                            tehsil_id=float(tehsil_id_val) if tehsil_id_val not in (None, "") else None,
                            mouza=mouza_val or "",
                            mouza_id=mouza_id_float,
                            geom=g,
                        )
                        mouza_obj.save()
                        created.append(mouza_obj.id)

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message=f"Imported {len(created)} Mouza features.",
                data={"created": len(created)},
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Import failed.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

        finally:
            try:
                # cleanup
                for fn in os.listdir(tmpdir):
                    p = os.path.join(tmpdir, fn)
                    if os.path.isfile(p):
                        os.remove(p)
                os.rmdir(tmpdir)
            except Exception:
                pass
