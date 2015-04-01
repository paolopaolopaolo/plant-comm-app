from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.conf import settings
from gardening.views import *

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'plant_app.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', LandingPage.as_view(), name="landing"),
    url(r'^profile/gardener/(?P<id>[0-9]+|pic)$', GardenerAPI.as_view(), name='GardenerAPI'),
    url(r'^profile/plant/(?P<id>[0-9]+){0,1}$', PlantAPI.as_view(), name='PlantAPI'),
    url(r'^profile/plantimg/(?P<id>[0-9]+){0,1}$', PlantImgAPI.as_view(), name='PlantImgAPI'),
    url(r'^profile/(?P<_id>[0-9]+|new){0,1}$', ProfilePage.as_view(), name="profile"),
    # url(r'^profile/(?P<_id>[0-9]+)*', ProfilePage.as_view(route="image"), name="profile_image"),
    url(r"^feed/", FeedPage.as_view(), name="feed"),
    url(r"^logout/", "gardening.views.log_out", name="logout"),
    
)

if settings.DEBUG:
	urlpatterns += static(r'media/', document_root=settings.MEDIA_ROOT)
	urlpatterns += static(r'static/', document_root=settings.STATIC_ROOT)
