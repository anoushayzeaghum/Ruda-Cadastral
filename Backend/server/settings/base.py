
from pathlib import Path
import os
import json
from datetime import timedelta 

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load secrets.json if exists
SECRETS_FILE = BASE_DIR / "secrets.json"
if SECRETS_FILE.exists():
    with open(SECRETS_FILE) as f:
        secrets = json.load(f)
else:
    secrets = {}

def get_secret(key, default=None):
    try:
        return secrets[key]
    except KeyError:
        if default is not None:
            return default
        raise KeyError(f"Set the {key} variable in secrets.json")

# SECRET_KEY — fallback if not found in env
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", secrets.get("SECRET_KEY", "dev-secret-key"))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-xfg45)2$253-9o8ts*_006iv7o%=3og$sx(@q9x9^vhv_(_7d_'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

GDAL_LIBRARY_PATH = get_secret("GDAL_LIBRARY_PATH")
GEOS_LIBRARY_PATH = get_secret("GEOS_LIBRARY_PATH")

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

AUTH_PROFILE_MODULE = "api.MyUser"

AUTH_USER_MODEL = "api.MyUser"

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis', 
    'rest_framework',
    'rest_framework_gis',
    "corsheaders",
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "corsheaders.middleware.CorsMiddleware", 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = "server.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "server.wsgi.application"

# Default DB for base: sqlite (safe for fresh start)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF minimal
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
}

# CORS (keep empty here, override in local/prod)
CORS_ALLOWED_ORIGINS = []
