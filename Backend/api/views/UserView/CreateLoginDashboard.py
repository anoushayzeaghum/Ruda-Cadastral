from rest_framework.response import Response
from rest_framework import status, viewsets, serializers
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, login

from ..common_imports import *


class UserLoginDashboardCreateView(viewsets.ViewSet):
    queryset = MyUser.objects.all()
    serializer_class = MyUserLoginDashboardSerializer
    permission_classes = [AllowAny]

    def create(self, request):
        try:
            email = request.data.get("email", "").strip().lower()
            password = request.data.get("password", "")

            if not email or not password:
                return ApiResponse(
                    status=status.HTTP_400_BAD_REQUEST,
                    message="Credentials missing",
                    http_status=status.HTTP_400_BAD_REQUEST,
                ).create_response()

            user = get_user_model().objects.filter(email__iexact=email).first()

            if user and user.check_password(password) and user.is_active:
                login(request, user)

                refresh = RefreshToken.for_user(user)
                auth_data = {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }

                res = {
                    "msg": {
                        "login": "Login Success",
                        "verified": user.is_verified,
                    },
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "id": user.id,
                    "token": auth_data["access"],
                    "refresh": auth_data["refresh"],
                    "role": user.role,
                    "is_active": user.is_active,
                    **auth_data,
                }

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Login Success",
                    data=res,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_401_UNAUTHORIZED,
                message="Invalid Credentials",
                http_status=status.HTTP_401_UNAUTHORIZED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Serializer error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()