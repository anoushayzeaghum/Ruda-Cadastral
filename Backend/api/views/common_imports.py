# api/views/common_imports.py

# Django imports
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.contrib.auth import get_user_model
from ..models import MyUser
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# DRF imports
# from rest_framework import viewsets, permissions, status, serializers
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models.functions import ExtractMonth

# Import models and serializers from the current app
from ..models import *
from ..serializers import *

# Custom utilities
import api.utils as utils
from ..utils import ApiResponse, get_tokens_for_user

from django.db import connection
from django.db.models import Q, Count, Sum, F

# Export Excel
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
import pandas as pd
from django.http import FileResponse