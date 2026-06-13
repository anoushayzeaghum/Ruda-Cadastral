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

#--------------------------------- Murabba View ---------------------------------
router.register(r"murabba", ListMurabbaView, basename="murabba")
router.register(r"murabba/create", CreateMurabbaView, basename="create-murabba")
router.register(r"murabba/update", UpdateMurabbaView, basename="update-murabba")
router.register(r"murabba/delete", DeleteMurabbaView, basename="delete-murabba")

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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    path("import/district/", import_district_shapefile),
    
    path('', include(router.urls)),
]