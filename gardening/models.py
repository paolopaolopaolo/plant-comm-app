from django.db import models
# from django.contrib.auth.models import AbstractUser, PermissionsMixin, Group
from django.contrib.auth.models import User
from django.db.models.signals import post_delete
from django.dispatch.dispatcher import receiver
from django.conf import settings
import os, random

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

PAGES = (
            ('LA', "Landing Page"),
            ('PR', "Profile Page"),
            ('FE', "Feed Page"),
            ('NA', "Unassigned")
        )


EVENTS = (
            ('NP', 'new plant'),
            ('NI', 'new plant image'),
            ('CL', 'change location'),
            ('CU', 'change username'),
            ('CN', 'change name'),
            ('CP', 'change profile picture'),
        )

# Sets filepath for profile pics
def profile_path(instance, filename):
    return os.path.join(
            "profilepic",
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

class Content(models.Model):
    page = models.CharField(max_length = 2, default = "NA", choices = PAGES)
    descriptor = models.CharField(max_length = 20, default = "")
    content = models.TextField(default = "")

    def __unicode__(self):
        return unicode(" : ".join((self.page, self.descriptor)))

# Authentication and some other attributes
class Gardener(models.Model):
    user = models.OneToOneField(User)
    online = models.BooleanField(default = False)
    username = models.CharField(max_length = 50, default = "")
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

    def randomNumberString(self, integer):
        result = ""
        for time in range(0, integer):
            result = "".join([result, str(random.randrange(10))])
        return result

    def save(self, *args, **kwargs):
        # Save this photo instance
        super(PlantImg, self).save(*args, **kwargs)

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


        suf.name = "".join(suf.name.split(".")[0: -1])

        suf.name = "".join([str(self.id), suf.name, self.randomNumberString(20)])

        self.thumbnail.save(suf.name+'.png', suf, save=False)

         # Save this photo instance
        super(PlantImg, self).save(*args, **kwargs)


    def __unicode__(self):
        return "%s: %s" % (unicode(self.plant.user.user.username),  unicode(self.id))

class Convo(models.Model):
    text = models.TextField()
    time_initiated = models.DateTimeField(auto_now = True)
    user_a = models.ForeignKey(Gardener, related_name = "+")
    user_b = models.ForeignKey(Gardener, related_name = "+")
    active = models.BooleanField(default = True)
    seen_a = models.BooleanField(default = False)
    seen_b = models.BooleanField(default = False)
    

    def __unicode__(self):
        return "Convo:%s:: %s: %s" % (
                                        unicode(self.id),
                                        unicode(self.user_a.username),
                                        unicode(self.user_b.username)
                                      )



class Event(models.Model):
    user = models.ForeignKey(Gardener)
    time_happened = models.DateTimeField(auto_now = True)
    plant = models.ForeignKey(Plant, default = None, null=True)
    plant_img = models.ForeignKey(PlantImg, default = None, null=True)
    event = models.CharField(max_length = 3, choices = EVENTS)

# Job Description that will be shown with respect to the User
class Job(models.Model):
    user = models.ForeignKey(Gardener)
    time = models.DateTimeField(auto_now = True)
    text_description = models.CharField(max_length = 700)

class Comment(models.Model):
    job = models.ForeignKey(Job)
    time = models.DateTimeField(auto_now = True)
    text = models.TextField()

@receiver(post_delete, sender=Gardener)
def profile_pic_delete(sender, instance, **kwargs):
    instance.profile_pic.delete(False)


@receiver(post_delete, sender=PlantImg)
def plant_image_delete(sender, instance, **kwargs):
    instance.image.delete(False)
    instance.thumbnail.delete(False)