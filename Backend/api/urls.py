from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import *
from api.views.RudaMasterPlan import *
from api.views.GISMetaverse import *


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

# ------------------------------ RUDA Master Plan Views ------------------------------
router.register(r"city-level-service", ListCityLevelServiceView, basename="city-level-service")
router.register(r"city-level-service/create", CreateCityLevelServiceView, basename="create-city-level-service")
router.register(r"city-level-service/update", UpdateCityLevelServiceView, basename="update-city-level-service")
router.register(r"city-level-service/delete", DeleteCityLevelServiceView, basename="delete-city-level-service")

router.register(r"forest-boundary", ListForestBoundaryView, basename="forest-boundary")
router.register(r"forest-boundary/create", CreateForestBoundaryView, basename="create-forest-boundary")
router.register(r"forest-boundary/update", UpdateForestBoundaryView, basename="update-forest-boundary")
router.register(r"forest-boundary/delete", DeleteForestBoundaryView, basename="delete-forest-boundary")

router.register(r"precient-boundary", ListPrecientBoundaryView, basename="precient-boundary")
router.register(r"precient-boundary/create", CreatePrecientBoundaryView, basename="create-precient-boundary")
router.register(r"precient-boundary/update", UpdatePrecientBoundaryView, basename="update-precient-boundary")
router.register(r"precient-boundary/delete", DeletePrecientBoundaryView, basename="delete-precient-boundary")

router.register(r"river", ListRiverView, basename="river")
router.register(r"river/create", CreateRiverView, basename="create-river")
router.register(r"river/update", UpdateRiverView, basename="update-river")
router.register(r"river/delete", DeleteRiverView, basename="delete-river")

router.register(r"river-ravi", ListRiverRaviView, basename="river-ravi")
router.register(r"river-ravi/create", CreateRiverRaviView, basename="create-river-ravi")
router.register(r"river-ravi/update", UpdateRiverRaviView, basename="update-river-ravi")
router.register(r"river-ravi/delete", DeleteRiverRaviView, basename="delete-river-ravi")

router.register(r"ruda-jurisdiction", ListRudaJurisdictionView, basename="ruda-jurisdiction")
router.register(r"ruda-jurisdiction/create", CreateRudaJurisdictionView, basename="create-ruda-jurisdiction")
router.register(r"ruda-jurisdiction/update", UpdateRudaJurisdictionView, basename="update-ruda-jurisdiction")
router.register(r"ruda-jurisdiction/delete", DeleteRudaJurisdictionView, basename="delete-ruda-jurisdiction")

router.register(r"city-level-service-points", ListCityLevelServicePointsView, basename="city-level-service-points")
router.register(r"city-level-service-points/create", CreateCityLevelServicePointsView, basename="create-city-level-service-points")
router.register(r"city-level-service-points/update", UpdateCityLevelServicePointsView, basename="update-city-level-service-points")
router.register(r"city-level-service-points/delete", DeleteCityLevelServicePointsView, basename="delete-city-level-service-points")

router.register(r"mp-principle-zoning", ListMpPrincipleZoningView, basename="mp-principle-zoning")
router.register(r"mp-principle-zoning/create", CreateMpPrincipleZoningView, basename="create-mp-principle-zoning")
router.register(r"mp-principle-zoning/update", UpdateMpPrincipleZoningView, basename="update-mp-principle-zoning")
router.register(r"mp-principle-zoning/delete", DeleteMpPrincipleZoningView, basename="delete-mp-principle-zoning")

router.register(r"existing-forest", ListExistingForestView, basename="existing-forest")
router.register(r"existing-forest/create", CreateExistingForestView, basename="create-existing-forest")
router.register(r"existing-forest/update", UpdateExistingForestView, basename="update-existing-forest")
router.register(r"existing-forest/delete", DeleteExistingForestView, basename="delete-existing-forest")

router.register(r"ruda-planning-boundary", ListRudaPlanningBoundaryView, basename="ruda-planning-boundary")
router.register(r"ruda-planning-boundary/create", CreateRudaPlanningBoundaryView, basename="create-ruda-planning-boundary")
router.register(r"ruda-planning-boundary/update", UpdateRudaPlanningBoundaryView, basename="update-ruda-planning-boundary")
router.register(r"ruda-planning-boundary/delete", DeleteRudaPlanningBoundaryView, basename="delete-ruda-planning-boundary")

router.register(r"proposed-road-network", ListProposedRoadNetworkView, basename="proposed-road-network")
router.register(r"proposed-road-network/create", CreateProposedRoadNetworkView, basename="create-proposed-road-network")
router.register(r"proposed-road-network/update", UpdateProposedRoadNetworkView, basename="update-proposed-road-network")
router.register(r"proposed-road-network/delete", DeleteProposedRoadNetworkView, basename="delete-proposed-road-network")


# ------------------------------ Imported Land Table Views ------------------------------
router.register(r"stateland", ListStateLandView, basename="stateland")
router.register(r"stateland/create", CreateStateLandView, basename="create-stateland")
router.register(r"stateland/update", UpdateStateLandView, basename="update-stateland")
router.register(r"stateland/delete", DeleteStateLandView, basename="delete-stateland")

router.register(r"rtwalignment", ListRtwAlignmentView, basename="rtwalignment")
router.register(r"rtwalignment/create", CreateRtwAlignmentView, basename="create-rtwalignment")
router.register(r"rtwalignment/update", UpdateRtwAlignmentView, basename="update-rtwalignment")
router.register(r"rtwalignment/delete", DeleteRtwAlignmentView, basename="delete-rtwalignment")

router.register(r"possessionland", ListPossessionLandView, basename="possessionland")
router.register(r"possessionland/create", CreatePossessionLandView, basename="create-possessionland")
router.register(r"possessionland/update", UpdatePossessionLandView, basename="update-possessionland")
router.register(r"possessionland/delete", DeletePossessionLandView, basename="delete-possessionland")

router.register(r"awardedland", ListAwardedLandView, basename="awardedland")
router.register(r"awardedland/create", CreateAwardedLandView, basename="create-awardedland")
router.register(r"awardedland/update", UpdateAwardedLandView, basename="update-awardedland")
router.register(r"awardedland/delete", DeleteAwardedLandView, basename="delete-awardedland")

router.register(r"rtwpackage", ListRtwPackageView, basename="rtwpackage")
router.register(r"rtwpackage/create", CreateRtwPackageView, basename="create-rtwpackage")
router.register(r"rtwpackage/update", UpdateRtwPackageView, basename="update-rtwpackage")
router.register(r"rtwpackage/delete", DeleteRtwPackageView, basename="delete-rtwpackage")

router.register(r"branch-canal", ListBranchCanalView, basename="branch-canal",)
router.register(r"branch-canal/create", CreateBranchCanalView, basename="create-branch-canal",)
router.register(r"branch-canal/update", UpdateBranchCanalView, basename="update-branch-canal",)
router.register(r"branch-canal/delete", DeleteBranchCanalView, basename="delete-branch-canal",)

router.register(r"distributary", ListDistributaryView, basename="distributary",)
router.register(r"distributary/create", CreateDistributaryView, basename="create-distributary",)
router.register(r"distributary/update", UpdateDistributaryView, basename="update-distributary",)
router.register(r"distributary/delete", DeleteDistributaryView, basename="delete-distributary",)

router.register(r"existing-drains", ListExistingDrainsView, basename="existing-drains",)
router.register(r"existing-drains/create", CreateExistingDrainsView, basename="create-existing-drains",)
router.register(r"existing-drains/update", UpdateExistingDrainsView, basename="update-existing-drains",)
router.register(r"existing-drains/delete", DeleteExistingDrainsView, basename="delete-existing-drains",)

router.register(r"irrigation-network", ListIrrigationNetworkView, basename="irrigation-network",)
router.register(r"irrigation-network/create", CreateIrrigationNetworkView, basename="create-irrigation-network",)
router.register(r"irrigation-network/update", UpdateIrrigationNetworkView, basename="update-irrigation-network",)
router.register(r"irrigation-network/delete", DeleteIrrigationNetworkView, basename="delete-irrigation-network",)

router.register(r"katar-band-wwtp", ListKatarBandWWTPView, basename="katar-band-wwtp",)
router.register(r"katar-band-wwtp/create", CreateKatarBandWWTPView, basename="create-katar-band-wwtp",)
router.register(r"katar-band-wwtp/update", UpdateKatarBandWWTPView, basename="update-katar-band-wwtp",)
router.register(r"katar-band-wwtp/delete", DeleteKatarBandWWTPView, basename="delete-katar-band-wwtp",)

router.register(r"link-canal", ListLinkCanalView, basename="link-canal",)
router.register(r"link-canal/create", CreateLinkCanalView, basename="create-link-canal",)
router.register(r"link-canal/update", UpdateLinkCanalView, basename="update-link-canal",)
router.register(r"link-canal/delete", DeleteLinkCanalView, basename="delete-link-canal",)

router.register(r"proposed-wwtp", ListProposedWWTPView, basename="proposed-wwtp",)
router.register(r"proposed-wwtp/create", CreateProposedWWTPView, basename="create-proposed-wwtp",)
router.register(r"proposed-wwtp/update", UpdateProposedWWTPView, basename="update-proposed-wwtp",)
router.register( r"proposed-wwtp/delete", DeleteProposedWWTPView, basename="delete-proposed-wwtp",)

router.register(r"swtp-site", ListSWTPSiteView, basename="swtp-site",)
router.register(r"swtp-site/create", CreateSWTPSiteView, basename="create-swtp-site",)
router.register(r"swtp-site/update", UpdateSWTPSiteView, basename="update-swtp-site",)
router.register(r"swtp-site/delete", DeleteSWTPSiteView, basename="delete-swtp-site",)

router.register(r"wwtp-sites", ListWWTPSitesView, basename="wwtp-sites",)
router.register(r"wwtp-sites/create", CreateWWTPSitesView, basename="create-wwtp-sites",)
router.register(r"wwtp-sites/update", UpdateWWTPSitesView, basename="update-wwtp-sites",)
router.register(r"wwtp-sites/delete", DeleteWWTPSitesView, basename="delete-wwtp-sites",)


router.register(r"abdul-hakeem-motorway-m3", ListAbdulHakeemMotorwayM3View, basename="abdul-hakeem-motorway-m3")
router.register(r"abdul-hakeem-motorway-m3/create", CreateAbdulHakeemMotorwayM3View, basename="create-abdul-hakeem-motorway-m3")
router.register(r"abdul-hakeem-motorway-m3/update", UpdateAbdulHakeemMotorwayM3View, basename="update-abdul-hakeem-motorway-m3")
router.register(r"abdul-hakeem-motorway-m3/delete", DeleteAbdulHakeemMotorwayM3View, basename="delete-abdul-hakeem-motorway-m3")

router.register(r"hardo-sohal-muslim-road", ListHardoSohalMuslimRoadView, basename="hardo-sohal-muslim-road")
router.register(r"hardo-sohal-muslim-road/create", CreateHardoSohalMuslimRoadView, basename="create-hardo-sohal-muslim-road")
router.register(r"hardo-sohal-muslim-road/update", UpdateHardoSohalMuslimRoadView, basename="update-hardo-sohal-muslim-road")
router.register(r"hardo-sohal-muslim-road/delete", DeleteHardoSohalMuslimRoadView, basename="delete-hardo-sohal-muslim-road")

router.register(r"jinnah-avenue-road", ListJinnahAvenueRoadView, basename="jinnah-avenue-road")
router.register(r"jinnah-avenue-road/create", CreateJinnahAvenueRoadView, basename="create-jinnah-avenue-road")
router.register(r"jinnah-avenue-road/update", UpdateJinnahAvenueRoadView, basename="update-jinnah-avenue-road")
router.register(r"jinnah-avenue-road/delete", DeleteJinnahAvenueRoadView, basename="delete-jinnah-avenue-road")

router.register(r"kala-khata-ji-interchange", ListKalaKhataJiInterchangeView, basename="kala-khata-ji-interchange")
router.register(r"kala-khata-ji-interchange/create", CreateKalaKhataJiInterchangeView, basename="create-kala-khata-ji-interchange")
router.register(r"kala-khata-ji-interchange/update", UpdateKalaKhataJiInterchangeView, basename="update-kala-khata-ji-interchange")
router.register(r"kala-khata-ji-interchange/delete", DeleteKalaKhataJiInterchangeView, basename="delete-kala-khata-ji-interchange")

router.register(r"katar-bund-road", ListKatarBundRoadView, basename="katar-bund-road")
router.register(r"katar-bund-road/create", CreateKatarBundRoadView, basename="create-katar-bund-road")
router.register(r"katar-bund-road/update", UpdateKatarBundRoadView, basename="update-katar-bund-road")
router.register(r"katar-bund-road/delete", DeleteKatarBundRoadView, basename="delete-katar-bund-road")

router.register(r"lahore-bypass", ListLahoreBypassView, basename="lahore-bypass")
router.register(r"lahore-bypass/create", CreateLahoreBypassView, basename="create-lahore-bypass")
router.register(r"lahore-bypass/update", UpdateLahoreBypassView, basename="update-lahore-bypass")
router.register(r"lahore-bypass/delete", DeleteLahoreBypassView, basename="delete-lahore-bypass")

router.register(r"sialkot-motorway", ListSialkotMotorwayView, basename="sialkot-motorway")
router.register(r"sialkot-motorway/create", CreateSialkotMotorwayView, basename="create-sialkot-motorway")
router.register(r"sialkot-motorway/update", UpdateSialkotMotorwayView, basename="update-sialkot-motorway")
router.register(r"sialkot-motorway/delete", DeleteSialkotMotorwayView, basename="delete-sialkot-motorway")

router.register(r"transportation-roads", ListTransportationRoadsView, basename="transportation-roads")
router.register(r"transportation-roads/create", CreateTransportationRoadsView, basename="create-transportation-roads")
router.register(r"transportation-roads/update", UpdateTransportationRoadsView, basename="update-transportation-roads")
router.register(r"transportation-roads/delete", DeleteTransportationRoadsView, basename="delete-transportation-roads")

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

    path(
        "plot-options/",
        PlotOptionsView.as_view(),
        name="plot-options"
    ),
    path('', include(router.urls)),
]
