import os
import uuid
import jwt
import string
import secrets
from collections import defaultdict
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from rest_framework import status as http_status
from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


# -----------------------------
# 🔐 JWT / Token Utilities
# -----------------------------
def get_tokens_for_user(user):
    """Generate JWT refresh + access tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def get_user_name_token(token):
    """Decode a JWT and return the username (signature not verified)."""
    decoded_token = jwt.decode(
        token, algorithms=['RS256'], options={"verify_signature": False}
    )
    return decoded_token.get('username')


# -----------------------------
# 📄 File Upload Utilities
# -----------------------------
def project_image_file_path(instance, filename):
    """Generate file path for new project image using UUID."""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('images/', filename)


def project_doc_file_path(instance, filename):
    """Generate file path for new project document using UUID."""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('docs/', filename)


# -----------------------------
# 🔑 Random String Utilities
# -----------------------------
def generate_random_string(length=8, allowed_chars=string.ascii_letters + string.digits):
    return ''.join(secrets.choice(allowed_chars) for _ in range(length))


passkey = get_random_string(length=8)


# -----------------------------
# 📦 API Response Wrapper
# -----------------------------
class ApiResponse:
    """
    A class for constructing a standardized server response.
    """

    def __init__(self, status: int, message: str = None, data: dict = None,
                 error_traceback=None, http_status=http_status.HTTP_200_OK):
        self.response = {}
        self.status = status
        self.message = message
        self.data = data if data is not None else {}
        self.error_traceback = (
            error_traceback.replace("\n", ",") if error_traceback else None
        )
        self.http_status = http_status

    def create_response(self):
        """Return a DRF Response object."""
        self.response.update({
            'status': self.status,
            'message': self.message,
            'data': self.data,
            'error_traceback': self.error_traceback,
        })
        return Response(self.response, status=self.http_status)

    def create_json_response(self):
        """Return a Django JsonResponse object."""
        self.response.update({
            'status': self.status,
            'message': self.message,
            'data': self.data,
            'error_traceback': self.error_traceback,
        })
        return JsonResponse(self.response, status=self.http_status)


# -----------------------------
# ❌ Error Helpers
# -----------------------------
def get_error_message(serializer):
    """Extract the first error message from a serializer's errors."""
    errors = list(serializer.errors.values())
    return errors[0][0] if errors else 'Unknown error'


def get_error_message_list(error):
    """Convert error details into a list of error messages."""
    if isinstance(error, str):
        return [error]
    if hasattr(error, 'detail') and isinstance(error.detail, list):
        return error.detail
    return [f"{key}: {value[0]}" for key, value in error.detail.items()]


def get_error_message_list_serializer(errors):
    """Convert serializer errors into a dictionary of field-specific error messages."""
    return {
        field: (error_list[0] if isinstance(error_list, list) else error_list)
        for field, error_list in errors.items()
    }


# -----------------------------
# 🔒 Custom Permissions
# -----------------------------
class IsAdminUserForCreate(BasePermission):
    """Allow only admins to create objects (POST requests)."""
    def has_permission(self, request, view):
        if request.method == 'POST':
            return request.user and request.user.is_admin
        return True


# -----------------------------
# 📑 Pagination
# -----------------------------
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def paginate_queryset(self, queryset, request, view=None):
        sort_by = request.query_params.get('sortBy')
        sort_dir = request.query_params.get('sortDir', 'asc')

        if sort_by:
            if sort_dir == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)

        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'results': data
        })


# -----------------------------
# 📝 QueryDict Parser
# -----------------------------
def parse_nested_query_dict(query_dict):
    """
    Parse a QueryDict with nested keys into a standard dictionary.
    Supports formats like: multipleuserdoc[0][doc_name], multipleuserdoc[0][doc_type], etc.
    """
    data = defaultdict(lambda: defaultdict(dict))

    for key, value in query_dict.items():
        if 'multipleuserdoc[' in key:
            index = int(key.split('[')[1].split(']')[0])
            field = key.split('[')[2][:-1]  # doc_name, doc_type, etc.
            data['multipleuserdoc'][index][field] = value
        else:
            data[key] = value

    if isinstance(data['multipleuserdoc'], defaultdict):
        data['multipleuserdoc'] = [dict(item) for item in data['multipleuserdoc'].values()]

    return dict(data)
