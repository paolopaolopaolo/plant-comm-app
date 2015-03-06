from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.conf import settings
from gardening.views import LandingPage, LoginPage, ProfilePage, FeedPage

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'plant_app.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', LandingPage.as_view(), name="landing"),
    url(r'^login/', LoginPage.as_view(), name="login"),
    url(r'^profile/', ProfilePage.as_view(), name="profile"),
    url(r"^feed/", FeedPage.as_view(), name="feed")
    
)

if settings.DEBUG:
	pass
