from django.db import models
# from django.contrib.auth.models import AbstractUser, PermissionsMixin, Group
from django.contrib.auth.models import User
from simple_email_confirmation import SimpleEmailConfirmationUserMixin
from django.conf import settings
import os

def profile_path(instance, filename):
	return os.path.join(
			os.path.dirname(settings.STATIC_ROOT),
			"media",
			"profile_pic",
			instance.username,
			filename
		)

# Create your models here.

# Authentication and some other attributes
class Gardener(models.Model, SimpleEmailConfirmationUserMixin):
	user = models.OneToOneField(User)
	profile_pic = models.ImageField(upload_to = profile_path)
	favorites = models.ManyToManyField("self", symmetrical=False)
	text_blurb = models.CharField(max_length = 700, default="")
	available = models.BooleanField(default = False)

# Plant information
class Plant(models.Model):
	user = models.ForeignKey(Gardener)
	species = models.CharField(max_length = 200)
	quantity = models.IntegerField(default = 1)
	information = models.TextField()

# Images of each plant
class PlantImg(models.Model):
	plant = models.ForeignKey(Plant)

# Job Description that will be shown with respect to the User
class Job(models.Model):
	text_description = models.CharField(max_length = 700)
	user = models.OneToOneField(Gardener)
	periodic = models.BooleanField(default=False)
	start_date = models.DateField()
	end_date = models.DateField()