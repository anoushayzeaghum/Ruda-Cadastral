from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import *

router = DefaultRouter()

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

urlpatterns = [
    path('', include(router.urls)),
]