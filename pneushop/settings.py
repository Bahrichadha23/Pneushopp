"""
Django settings for pneushop project.
"""
import pathlib
import os
from datetime import timedelta
from decouple import config
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'pneushop-backend.vercel.app',
    'pneushop.tn',
    'www.pneushop.tn',
    'localhost:3000',
    '102.211.210.215',
    '102.211.210.249',
    'soulaima16.obg.com.tn',
    'obg.com.tn',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework.authtoken',
    'corsheaders',
    'accounts',
    'products',
    'cart',
    'favorites',
    'orders',
    'suppliers',
    'purchases',
    'cloudinary',
    'cloudinary_storage',
    'communication',
]

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': config('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
}

cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME', default=''),
    api_key=config('CLOUDINARY_API_KEY', default=''),
    api_secret=config('CLOUDINARY_API_SECRET', default=''),
    secure=True,
)

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'pneushop.cors_middleware.CorsAlwaysAllowMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'pneushop.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pneushop.wsgi.application'

DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL', default='sqlite:///db.sqlite3'),
        conn_max_age=600,
        ssl_require=False,
    )
}

# Increase connection timeout for Neon PostgreSQL
DATABASES['default']['OPTIONS'] = {
    'connect_timeout': 10,
    'sslmode': 'require',
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
]

AUTH_USER_MODEL = 'accounts.CustomUser'

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Tunis'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10240

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://102.211.210.249:3001',
]
CORS_ALLOW_CREDENTIALS = True

# ─── Email — Postmark (SMTP) ─────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.postmarkapp.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('POSTMARK_SERVER_TOKEN', default='')
EMAIL_HOST_PASSWORD = config('POSTMARK_SERVER_TOKEN', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='nepasrepondre@pneushop.tn')

# ─── App-level email addresses ───────────────────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Admin email — accès backend + notifications commandes
ADMIN_EMAIL = config('ADMIN_EMAIL', default='admin@pneushop.tn')

# Sales responsible email — reçoit les détails de chaque nouvelle commande
SALES_EMAIL = config('SALES_EMAIL', default='service.commercial@pneushop.tn')

# Developer email — reçoit les messages du support
DEVELOPER_EMAIL = config('DEVELOPER_EMAIL', default='chathabahri55@gmail.com')

# Contact email — reçoit les messages du formulaire de contact (frontend)
CONTACT_EMAIL = config('CONTACT_EMAIL', default='contact@pneushop.tn')

# Achat email — notifications achats fournisseurs
ACHAT_EMAIL = config('ACHAT_EMAIL', default='service.achat@pneushop.tn')

PASSWORD_RESET_TIMEOUT = 3600  # 1 hour in seconds
