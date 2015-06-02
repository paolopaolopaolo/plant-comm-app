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
    DOMAIN = 'http://54.148.204.235'


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GARDENING_DIR = os.path.join(BASE_DIR, "gardening")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
TEMPLATE_DIRS = (
                    os.path.join(TEMPLATE_DIR, "gardening"),
                    os.path.join(BASE_DIR, "static", "js", "backbone", "profile_page"),
                )

LOGIN_URL = '/'

REST_FRAMEWORK = {
#     'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 2
}

# Formattable Zipcode API URL
ZIPCODE_API_URL = ''.join([
    "https://www.zipcodeapi.com/rest/",
    "%s/",
    "distance.json/",
    "%s/",
    "%s/",
    "<units>"])

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'compressor',
    # 'simple_email_confirmation',
    'rest_framework',
    'mod_wsgi.server',
    'storages',
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

ROOT_URLCONF = 'plant_app.urls'

WSGI_APPLICATION = 'plant_app.wsgi.application'

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'), )

if DEBUG:
    with open(os.path.join(BASE_DIR, "ZIP_CODE_API.txt"), "rb") as zipcode:
        ZIPCODE_API_KEY = zipcode.read()
    with open(os.path.join(BASE_DIR, "SECRET_KEY.txt") ,'rb') as secret_key:
        SECRET_KEY = secret_key.read()

    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR), 'static')
    MEDIA_ROOT = os.path.join(STATIC_ROOT, "media")
    COMPRESS_ROOT = os.path.join(STATIC_ROOT, "COMPRESS")
    COMPRESS_URL = STATIC_URL

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': 'db',
            'CONN_MAX_AGE': None
        }
    }

    # DATABASES = {
    #     'default': {
    #         'ENGINE': 'django.db.backends.mysql',
    #         'OPTIONS': {
    #             'read_default_file': os.path.join(BASE_DIR, "MySQL.conf"),
    #         },
    #     }
    # }
    # with open(os.path.join(BASE_DIR, "AWS_SETTINGS.txt"), "rb") as AWS_INFORMATION:
    #     AWS_INFORMATION = AWS_INFORMATION.read().split("\n")
    #     AWS_STORAGE_BUCKET_NAME = AWS_INFORMATION[0]
    #     AWS_ACCESS_KEY_ID = AWS_INFORMATION[1]
    #     AWS_SECRET_ACCESS_KEY = AWS_INFORMATION[2]

else:
    ZIPCODE_API_KEY = os.environ['ZAP']
    SECRET_KEY = os.environ['SK']

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ['DB_NAME'],
            'USER': os.environ['DB_USER'],
            'PASSWORD': os.environ['DB_PW'],
            'HOST': os.environ['DB_HOST'],
            'PORT': os.environ['DB_PORT'],
            'CONN_MAX_AGE': None,
        }
    }
    # AWS Access Keys and Bucket Name
    AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
    AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
    AWS_STORAGE_BUCKET_NAME = os.environ['AWS_STORAGE_BUCKET_NAME']
    

# else:
ALLOWED_HOSTS = [
                 ".127.0.0.1:8000",
                 ".127.0.0.1:8000.",
                 ".54.148.204.235",
                 ".54.148.204.235.",
                 ".plantappstorage.s3.amazonaws.com",
                 ".plantappstorage.s3.amazonaws.com.",
                 ".s3-us-west-2.amazonaws.com",
                 ".s3-us-west-2.amazonaws.com/plantappstorage.",
                 ]

if not DEBUG:
    # Create Proper URLS for File Storage
    STATICFILES_STORAGE = 'gardening.custom_storages.StaticStorage'
    DEFAULT_FILE_STORAGE = 'gardening.custom_storages.MediaStorage'
    COMPRESS_STORAGE = STATICFILES_STORAGE
    AWS_S3_CUSTOM_DOMAIN = '%s.s3.amazonaws.com' % AWS_STORAGE_BUCKET_NAME
    STATICFILES_LOCATION = "static"
    MEDIAFILES_LOCATION = "media"
    COMPRESS_LOCATION = "static"
    STATIC_URL = "https://%s/%s/" % (AWS_S3_CUSTOM_DOMAIN, STATICFILES_LOCATION)
    MEDIA_URL =  "https://%s/%s/" % (AWS_S3_CUSTOM_DOMAIN, MEDIAFILES_LOCATION)
    # Set storage engines to custom Storages, separating static from media
    # Enable compression
    COMPRESS_ENABLED = True
    COMPRESS_URL = STATIC_URL
    COMPRESS_ROOT = os.path.join(os.path.dirname(BASE_DIR), 'COMPRESS')
    STATIC_ROOT = COMPRESS_ROOT
    MEDIA_ROOT = ''

# Django Compressor Settings
if COMPRESS_ENABLED:
    COMPRESS_OFFLINE = True
    STATICFILES_FINDERS = (
        "django.contrib.staticfiles.finders.FileSystemFinder",
        "django.contrib.staticfiles.finders.AppDirectoriesFinder",
        'compressor.finders.CompressorFinder',
        )
    COMPRESS_PRECOMPILERS = (
         ('text/less', 'lessc {infile} {outfile}'),
        )
    COMPRESS_CSS_FILTERS = [
                                'compressor.filters.css_default.CssAbsoluteFilter',
                            ]
                                # 'compressor.filters.cssmin.CSSMinFilter'


    
