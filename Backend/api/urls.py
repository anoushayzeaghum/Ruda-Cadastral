from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import *

router = DefaultRouter()

#--------------------------------- User View ---------------------------------
router.register(r'create-user', UserCreateView, basename='create-user')
router.register(r'login-user', UserLoginDashboardCreateView, basename='login-user')
router.register(r'get-user', GetUserView, basename='get-user')
router.register(r'update-user', UserUpdateView, basename='update-user')

#--------------------------------- District View ---------------------------------
router.register(r"district", ListDistrictView, basename="district")

#--------------------------------- Mauza View ---------------------------------
router.register(r"tehsil", ListTehsilView, basename="tehsil")

#--------------------------------- Mauza View ---------------------------------
router.register(r"mauza", ListMauzaView, basename="mauza")
router.register(r"mauza/create", CreateMauzaView, basename="create-mauza")
router.register(r"mauza/update", UpdateMauzaView, basename="update-mauza")
router.register(r"mauza/delete", DeleteMauzaView, basename="delete-mauza")
router.register(r"mauza/import", ImportMauzaView, basename="import-mauza")

#--------------------------------- Khasra View ---------------------------------
router.register(r"khasra", ListKhasraView, basename="khasra")   
router.register(r"khasra/create", CreateKhasraView, basename="create-khasra")
router.register(r"khasra/update", UpdateKhasraView, basename="update-khasra")
router.register(r"khasra/delete", DeleteKhasraView, basename="delete-khasra")

#------------------------------ Society View ------------------------------
router.register(r"society", ListSocietyView, basename="society")
router.register(r"society/create", CreateSocietyView, basename="create-society")
router.register(r"society/update", UpdateSocietyView, basename="update-society")
router.register(r"society/delete", DeleteSocietyView, basename="delete-society")

#------------------------------ Master Plan View ------------------------------
router.register(r"masterplan", ListMasterPlanView, basename="masterplan")
router.register(r"masterplan/create", CreateMasterPlanView, basename="create-masterplan")
router.register(r"masterplan/update", UpdateMasterPlanView, basename="update-masterplan")
router.register(r"masterplan/delete", DeleteMasterPlanView, basename="delete-masterplan")

#------------------------------ Spot Level View ------------------------------
router.register(r"spot-level", ListSpotLevelView, basename="spot-level")
router.register(r"spot-level/create", CreateSpotLevelView, basename="create-spot-level")
router.register(r"spot-level/update", UpdateSpotLevelView, basename="update-spot-level")
router.register(r"spot-level/delete", DeleteSpotLevelView, basename="delete-spot-level")

#------------------------------ Contour View ------------------------------
router.register(r"contour", ListContourView, basename="contour")
router.register(r"contour/create", CreateContourView, basename="create-contour")
router.register(r"contour/update", UpdateContourView, basename="update-contour")
router.register(r"contour/delete", DeleteContourView, basename="delete-contour")

#------------------------------ Ruda Proposed Roads View ------------------------------
router.register(r"ruda-proposed-roads", ListRudaProposedRoadsView, basename="ruda-proposed-roads")
router.register(r"ruda-proposed-roads/create", CreateRudaProposedRoadsView, basename="create-ruda-proposed-roads")
router.register(r"ruda-proposed-roads/update", UpdateRudaProposedRoadsView, basename="update-ruda-proposed-roads")
router.register(r"ruda-proposed-roads/delete", DeleteRudaProposedRoadsView, basename="delete-ruda-proposed-roads")

#------------------------------ Ruda Boundary View ------------------------------
router.register(r"ruda", ListRudaBoundaryView, basename="ruda")
router.register(r"ruda/create", CreateRudaBoundaryView, basename="create-ruda")
router.register(r"ruda/update", UpdateRudaBoundaryView, basename="update-ruda")
router.register(r"ruda/delete", DeleteRudaBoundaryView, basename="delete-ruda")

#------------------------------ Ruda Boundary View ------------------------------
router.register(r"trijunction", ListTrijunctionView, basename="trijunction")
router.register(r"trijunction/create", CreateTrijunctionView, basename="create-trijunction")
router.register(r"trijunction/update", UpdateTrijunctionView, basename="update-trijunction")
router.register(r"trijunction/delete", DeleteTrijunctionView, basename="delete-trijunction")

#------------------------------ Square View ------------------------------
router.register(r"square", ListSquareView, basename="square")
router.register(r"square/create", CreateSquareView, basename="create-square")
router.register(r"square/update", UpdateSquareView, basename="update-square")
router.register(r"square/delete", DeleteSquareView, basename="delete-square")

#------------------------------ Acre View ------------------------------
router.register(r"acre", ListAcreView, basename="acre")
router.register(r"acre/create", CreateAcreView, basename="create-acre")
router.register(r"acre/update", UpdateAcreView, basename="update-acre")
router.register(r"acre/delete", DeleteAcreView, basename="delete-acre")

#------------------------------ Field Points View ------------------------------
router.register(r"fieldpoints", ListFieldPointsView, basename="fieldpoints")
router.register(r"fieldpoints/create", CreateFieldPointsView, basename="create-fieldpoints")
router.register(r"fieldpoints/update", UpdateFieldPointsView, basename="update-fieldpoints")
router.register(r"fieldpoints/delete", DeleteFieldPointsView, basename="delete-fieldpoints")

#------------------------------ Geodetic Network View ------------------------------
router.register(r"geodeticnetwork", ListGeodeticNetworkView, basename="geodeticnetwork")
router.register(r"geodeticnetwork/create", CreateGeodeticNetworkView, basename="create-geodeticnetwork")
router.register(r"geodeticnetwork/update", UpdateGeodeticNetworkView, basename="update-geodeticnetwork")
router.register(r"geodeticnetwork/delete", DeleteGeodeticNetworkView, basename="delete-geodeticnetwork")


# ------------------------------ Project Views ------------------------------
router.register(r"project", ListProjectView, basename="project")
router.register(r"project/create", CreateProjectView, basename="create-project")
router.register(r"project/update", UpdateProjectView, basename="update-project")
router.register(r"project/delete", DeleteProjectView, basename="delete-project")


# ------------------------------ Block Views ------------------------------
router.register(r"block", ListBlockView, basename="block")
router.register(r"block/create", CreateBlockView, basename="create-block")
router.register(r"block/update", UpdateBlockView, basename="update-block")
router.register(r"block/delete", DeleteBlockView, basename="delete-block")

# ------------------------------ BLock Level Views ------------------------------
router.register(r"block-level", ListBlockLevelView, basename="block-level")
router.register(r"block-level/create", CreateBlockLevelView, basename="create-block-level")
router.register(r"block-level/update", UpdateBlockLevelView, basename="update-block-level")
router.register(r"block-level/delete", DeleteBlockLevelView, basename="delete-block-level")

# ------------------------------ Plot Views ------------------------------
router.register(r"plot", ListPlotView, basename="plot")
router.register(r"plot/create", CreatePlotView, basename="create-plot")
router.register(r"plot/update", UpdatePlotView, basename="update-plot")
router.register(r"plot/delete", DeletePlotView, basename="delete-plot")

# ------------------------------ Road Views ------------------------------
router.register(r"road", ListRoadView, basename="road")
router.register(r"road/create", CreateRoadView, basename="create-road")
router.register(r"road/update", UpdateRoadView, basename="update-road")
router.register(r"road/delete", DeleteRoadView, basename="delete-road")

# ------------------------------ Camera Location Views ------------------------------
router.register(r"camera-location", ListCameraLocationView, basename="camera-location")
router.register(r"camera-location/create", CreateCameraLocationView, basename="create-camera-location")
router.register(r"camera-location/update", UpdateCameraLocationView, basename="update-camera-location")
router.register(r"camera-location/delete", DeleteCameraLocationView, basename="delete-camera-location")

# ------------------------------ SW PointViews ------------------------------
router.register(r"swpoint-cb1", ListSWPointView, basename="swpoint-cb1")
router.register(r"swpoint-cb1/create", CreateSWPointView, basename="create-swpoint-cb1")
router.register(r"swpoint-cb1/update", UpdateSWPointView, basename="update-swpoint-cb1")
router.register(r"swpoint-cb1/delete", DeleteSWPointView, basename="delete-swpoint-cb1")

# ------------------------------ WSL CB1 Views ------------------------------
router.register(r"wsl-cb1", ListWSLView, basename="wsl-cb1")
router.register(r"wsl-cb1/create", CreateWSLView, basename="create-wsl-cb1")
router.register(r"wsl-cb1/update", UpdateWSLView, basename="update-wsl-cb1")
router.register(r"wsl-cb1/delete", DeleteWSLView, basename="delete-wsl-cb1")

# ------------------------------ WS Point Features CB1 ------------------------------
router.register(r"wspoint-features-cb1", ListWSPointView, basename="wspoint-features-cb1")
router.register(r"wspoint-features-cb1/create", CreateWSPointView, basename="create-wspoint-features-cb1")
router.register(r"wspoint-features-cb1/update", UpdateWSPointView, basename="update-wspoint-features-cb1")
router.register(r"wspoint-features-cb1/delete", DeleteWSPointView, basename="delete-wspoint-features-cb1")

# ------------------------------ Project Mauza Views ------------------------------
router.register(r"project-mauza", ListProjectMauzaView, basename="project-mauza")
router.register(r"project-mauza/create", CreateProjectMauzaView, basename="create-project-mauza")
router.register(r"project-mauza/delete", DeleteProjectMauzaView, basename="delete-project-mauza")

urlpatterns = [
    path('admin/', admin.site.urls),

    # Custom plot-khasra intersection API.
    # Keep this BEFORE router.urls so DRF router does not try to resolve this as a plot detail route.
    path(
        'api/plot/<int:plot_gid>/intersecting-khasras/',
        PlotIntersectingKhasrasAPIView.as_view(),
        name='plot-intersecting-khasras',
    ),

    # Backup route in case this urls.py is included under /api/ from the project urls.
    # If this file is the project root urls.py, it will also expose:
    # http://localhost:8000/plot/<gid>/intersecting-khasras/
    path(
        'plot/<int:plot_gid>/intersecting-khasras/',
        PlotIntersectingKhasrasAPIView.as_view(),
        name='plot-intersecting-khasras-no-api-prefix',
    ),

    path('api/', include(router.urls)),

    path("import/district/", import_district_shapefile),
    path("import/tehsil/", import_tehsil_shapefile),
    path("import/mauza/", import_mauza_shapefile),
    # path("import/square/", import_square_shapefile),
    path("import/khasra/", import_khasra_shapefile),

    path('', include(router.urls)),
]
