from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings
from gardening.views import *
from gardening.chat_api import *
from gardening.rest_apis import *

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', LandingPage.as_view(), name="landing"),
    url(r'^uauth/', UserAuthenticationPage.as_view(), name="userauth"),
    url(r'zap/', ZipCodeAPI.as_view(), name="zipcode"),
    url(r'follow/(?P<id>[0-9]+){0,1}$', Following.as_view(), name="following"),
    # url(r'^profile/gardener/(?P<id>[0-9]+|pic){0,1}$', GardenerAPI.as_view(), name='GardenerAPI'),
    url(r'^profile/plant/(?P<id>[0-9]+){0,1}$', PlantAPI.as_view(), name='PlantAPI'),
    url(r'^profile/plantimg/(?P<id>[0-9]+){0,1}$', PlantImgAPI.as_view(), name='PlantImgAPI'),
    url(r"gardener/(?P<id>[0-9]+|pic){0,1}$", GardenerAPI.as_view(), name="GardenerAPI"),
    url(r'^profile/(?P<user>[^/ ]+){0,1}$', ProfilePage.as_view(), name="profile"),
    url(r"editconvo/(?P<id>[0-9]+)$", ChatAPI.as_view(), name="ChatAPI"),
    url(r"events/", EventsAPI.as_view(), name="EventsAPI"),
    url(r"jobs(/\?page\=\d+){0,1}/+(?P<id>[0-9]+){0,1}$", JobsAPI.as_view(), name="JobsAPI"),
    # url(r"comments/", CommentsAPI.as_view(), name="CommentsAPI"),
    url(r"^feed/$", FeedPage.as_view(), name="feed"),
    url(r"^logout/", "gardening.views.log_out", name="logout"),
    url(r"^search/", SearchAPI.as_view(), name="search"),
    url(r"test(/\?cursor\=\d+){0,1}/+(?P<id>[0-9]+){0,1}$", TestAPI.as_view(), name="TestAPI") 
)
 
if settings.DEBUG:
	urlpatterns += static(r'media/', document_root = settings.MEDIA_ROOT)
	urlpatterns += static(r'static/', document_root = settings.STATIC_ROOT)
