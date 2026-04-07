from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import *

router = DefaultRouter()

#--------------------------------- Division View ---------------------------------
router.register(r"division", ListDivisionView, basename="division")

#--------------------------------- District View ---------------------------------
router.register(r"district", ListDistrictView, basename="district")

#--------------------------------- Mouza View ---------------------------------
router.register(r"tehsil", ListTehsilView, basename="tehsil")

#--------------------------------- Mouza View ---------------------------------
router.register(r"mouza", ListMouzaView, basename="mouza")
router.register(r"mouza/create", CreateMouzaView, basename="create-mouza")
router.register(r"mouza/update", UpdateMouzaView, basename="update-mouza")
router.register(r"mouza/delete", DeleteMouzaView, basename="delete-mouza")

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
    
    path('', include(router.urls)),
]