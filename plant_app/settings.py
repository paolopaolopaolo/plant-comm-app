"""
Django settings for plant_app project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

try:
    from plant_app.local_settings import *
except ImportError:
    DEBUG = False
    TEMPLATE_DEBUG = False

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GARDENING_DIR = os.path.join(BASE_DIR, "gardening")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
TEMPLATE_DIRS = (
                    os.path.join(TEMPLATE_DIR, "gardening"),
                    os.path.join(BASE_DIR, "static", "js", "backbone", "profile_page"),
                )

LOGIN_URL = '/'

# Formattable Zipcode API URL
ZIPCODE_API_URL = ''.join([
    "https://www.zipcodeapi.com/rest/",
    "%s/",
    "distance.json/",
    "%s/",
    "%s/",
    "<units>"])


    # Allowed hosts
if DEBUG:
    ALLOWED_HOSTS = ["*",]
    with open(os.path.join(BASE_DIR, "ZIP_CODE_API.txt"), "rb") as zipcode:
        ZIPCODE_API_KEY = zipcode.read()

else:
    pass
    

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.7/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
with open(os.path.join(BASE_DIR, "secret_key.txt") ,'rb') as secret_key:
    SECRET_KEY = secret_key.read()

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'compressor',
    'simple_email_confirmation',
    'rest_framework',
    'gardening',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

# Django Compressor Settings
if not DEBUG:
    COMPRESS_ENABLED = True
    COMPRESS_OFFLINE = True
    STATICFILES_FINDERS = (
        "django.contrib.staticfiles.finders.FileSystemFinder",
        "django.contrib.staticfiles.finders.AppDirectoriesFinder",
        'compressor.finders.CompressorFinder',
        )
    COMPRESS_PRECOMPILERS = (
         ('text/less', 'lessc {infile} {outfile}'),
        )


ROOT_URLCONF = 'plant_app.urls'

WSGI_APPLICATION = 'plant_app.wsgi.application'

# Database
# https://docs.djangoproject.com/en/1.7/ref/settings/#databases
if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'OPTIONS': {
                'read_default_file': os.path.join(BASE_DIR, "MySQL.conf"),
            },
        }
    }

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/
STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'), )
STATIC_URL = '/static/'

if DEBUG:
    STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR), 'static')
    MEDIA_ROOT = os.path.join(STATIC_ROOT, "media")
