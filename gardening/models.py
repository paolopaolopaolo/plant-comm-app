from django.db import models
# from django.contrib.auth.models import AbstractUser, PermissionsMixin, Group
from django.contrib.auth.models import User
from simple_email_confirmation import SimpleEmailConfirmationUserMixin
from django.db.models.signals import post_delete
from django.dispatch.dispatcher import receiver
from django.conf import settings
import os

from PIL import Image
from cStringIO import StringIO
from django.core.files.uploadedfile import SimpleUploadedFile


# State Location Dictionary
STATE_ABBREVS = (
        ('AK', 'Alaska'),
        ('AL', 'Alabama'),
        ('AR', 'Arkansas'),
        ('AS', 'American Samoa'),
        ('AZ', 'Arizona'),
        ('CA', 'California'),
        ('CO', 'Colorado'),
        ('CT', 'Connecticut'),
        ('DC', 'District of Columbia'),
        ('DE', 'Delaware'),
        ('FL', 'Florida'),
        ('GA', 'Georgia'),
        ('GU', 'Guam'),
        ('HI', 'Hawaii'),
        ('IA', 'Iowa'),
        ('ID', 'Idaho'),
        ('IL', 'Illinois'),
        ('IN', 'Indiana'),
        ('KS', 'Kansas'),
        ('KY', 'Kentucky'),
        ('LA', 'Louisiana'),
        ('MA', 'Massachusetts'),
        ('MD', 'Maryland'),
        ('ME', 'Maine'),
        ('MI', 'Michigan'),
        ('MN', 'Minnesota'),
        ('MO', 'Missouri'),
        ('MP', 'Northern Mariana Islands'),
        ('MS', 'Mississippi'),
        ('MT', 'Montana'),
        ('NA', 'National'),
        ('NC', 'North Carolina'),
        ('ND', 'North Dakota'),
        ('NE', 'Nebraska'),
        ('NH', 'New Hampshire'),
        ('NJ', 'New Jersey'),
        ('NM', 'New Mexico'),
        ('NV', 'Nevada'),
        ('NY', 'New York'),
        ('OH', 'Ohio'),
        ('OK', 'Oklahoma'),
        ('OR', 'Oregon'),
        ('PA', 'Pennsylvania'),
        ('PR', 'Puerto Rico'),
        ('RI', 'Rhode Island'),
        ('SC', 'South Carolina'),
        ('SD', 'South Dakota'),
        ('TN', 'Tennessee'),
        ('TX', 'Texas'),
        ('UT', 'Utah'),
        ('VA', 'Virginia'),
        ('VI', 'Virgin Islands'),
        ('VT', 'Vermont'),
        ('WA', 'Washington'),
        ('WI', 'Wisconsin'),
        ('WV', 'West Virginia'),
        ('WY', 'Wyoming'),
)

# Sets filepath for profile pics
def profile_path(instance, filename):
    return os.path.join(
            "profile_pic",
            instance.user.username,
            filename
        )

# Sets filepath for plant pics
def plant_path(instance, filename):
    return os.path.join(
        "plant",
        str(instance.plant.id),
        filename
    )

# Create your models here.

# Authentication and some other attributes
class Gardener(models.Model, SimpleEmailConfirmationUserMixin):
    user = models.OneToOneField(User)
    first_name = models.CharField(max_length = 50, default = "")
    last_name = models.CharField(max_length = 50, default = "")
    profile_pic = models.ImageField(upload_to = profile_path, null = True)
    city = models.CharField(max_length = 100, default = "")
    state = models.CharField(max_length = 2, choices = STATE_ABBREVS)
    zipcode = models.CharField(max_length = 5, default = "")
    favorites = models.ManyToManyField("self", symmetrical=False)
    text_blurb = models.CharField(max_length = 700, default="")
    available = models.BooleanField(default = False)

    def __unicode__(self):
        return unicode(self.user.username)

# Plant information
class Plant(models.Model):
    user = models.ForeignKey(Gardener)
    species = models.CharField(max_length = 200)
    quantity = models.IntegerField(default = 1)
    information = models.TextField(default = "", null=True, blank = True)    

    def __unicode__(self):
        return "%s: %s" % (unicode(self.user.user.username),  unicode(self.species))

# Images of each plant
class PlantImg(models.Model):
    plant = models.ForeignKey(Plant)
    image = models.ImageField(upload_to = plant_path, default = None, null = True)
    thumbnail = models.ImageField(upload_to="plant_img_thumbnails/",
                                  default = None,
                                  blank = True,
                                  null = True)

    def save(self, *args, **kwargs):
        # Set our max thumbnail size in a tuple (max width, max height)
        THUMBNAIL_SIZE = (245, 275)

        # Open original photo which we want to thumbnail using PIL's Image
        # object
        curr_image = Image.open(self.image)

        # Convert to RGB if necessary
        # Thanks to Limodou on DjangoSnippets.org
        # http://www.djangosnippets.org/snippets/20/
        if curr_image.mode not in ('L', 'RGB'):
            curr_image = curr_image.convert('RGB')

        # We use our PIL Image object to create the thumbnail, which already
        # has a thumbnail() convenience method that contrains proportions.
        # Additionally, we use Image.ANTIALIAS to make the image look better.
        # Without antialiasing the image pattern artifacts may result.
        curr_image.thumbnail(THUMBNAIL_SIZE, Image.ANTIALIAS)

        # Save the thumbnail
        temp_handle = StringIO()
        curr_image.save(temp_handle, 'png')
        temp_handle.seek(0)

        # Save to the thumbnail field
        suf = SimpleUploadedFile(os.path.split(self.image.name)[-1],
                temp_handle.read(), content_type='image/png')
        self.thumbnail.save(suf.name+'.png', suf, save=False)

        # Save this photo instance
        super(PlantImg, self).save(*args, **kwargs)

    def __unicode__(self):
        return "%s: %s" % (unicode(self.plant.user.user.username),  unicode(self.id))

# Job Description that will be shown with respect to the User
class Job(models.Model):
    text_description = models.CharField(max_length = 700)
    user = models.OneToOneField(Gardener)
    periodic = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField()

@receiver(post_delete, sender=Gardener)
def profile_pic_delete(sender, instance, **kwargs):
    instance.profile_pic.delete(False)


@receiver(post_delete, sender=PlantImg)
def plant_image_delete(sender, instance, **kwargs):
    instance.image.delete(False)
    instance.thumbnail.delete(False)