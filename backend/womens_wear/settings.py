"""
Django settings for womens_wear project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR /".env")

SECRET_KEY = 'django-insecure-your-secret-key-change-this-in-production'

DEBUG = os.environ.get("DEBUG") == "True"

CORS_ALLOW_ALL_ORIGINS = True

MEDIA_URL = '/media/'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'store',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'womens_wear.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'womens_wear.wsgi.application'

DATABASES = {
    'default': {
         'ENGINE':'django.db.backends.postgresql',
        'NAME': os.getenv("DATABASE_NAME"),
        'USER': os.getenv('DATABASE_USER'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': os.getenv('DATABASE_HOST'),
        'PORT': os.getenv('DATABASE_PORT')
    }
}

# ── Rate limiting ─────────────────────────────────────────────────────────────
AXES_ENABLED = not DEBUG # Disable in development for easier testing and enabled in production
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 1
AXES_RESET_ON_SUCCESS = True
AXES_HANDLER = 'axes.handlers.database.AxesDatabaseHandler'
AXES_LOCKOUT_CALLABLE = 'api.utils.axes_lockout_response'
AXES_META_PRECEDENCE_ORDER = [
    'HTTP_X_FORWARDED_FOR',
    'REMOTE_ADDR',
]

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', default=587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', default=True) == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', default='odjerflorence610@gmail.com')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', default=EMAIL_HOST_USER)

# Admin Credentials
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', default='admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', default='admin123')

# SMS Configuration
AFRICAS_TALKING_USERNAME = os.getenv('AFRICAS_TALKING_USERNAME', default='sandbox')
AFRICAS_TALKING_API_KEY = os.getenv('AFRICAS_TALKING_API_KEY', default='')
ADMIN_PHONE_NUMBER = os.getenv('ADMIN_PHONE_NUMBER', default='+233000000000')

# ── Security (production only)
if not DEBUG:
    SESSION_COOKIE_SECURE       = True
    CSRF_COOKIE_SECURE          = True
    SECURE_HSTS_SECONDS         = 31536000
    SECURE_BROWSER_XSS_FILTER   = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS             = 'DENY'

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}
