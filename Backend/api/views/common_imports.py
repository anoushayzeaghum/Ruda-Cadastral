# Django imports
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models.functions import ExtractMonth
from django.db import connection
from django.db.models import Q, Count, Sum, F

# # Get user model correctly
# User = get_user_model()

# DRF imports
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied

# Import models and serializers
from ..models import *
from ..serializers import *

# Custom utilities
import api.utils as utils
from ..utils import ApiResponse, get_tokens_for_user

# Export Excel
from django.http import HttpResponse, FileResponse
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
import pandas as pd