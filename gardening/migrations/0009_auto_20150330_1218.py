# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import gardening.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0008_auto_20150330_1214'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='profile_pic',
            field=models.ImageField(null=True, upload_to=gardening.models.profile_path),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='user',
            field=models.OneToOneField(null=True, to=settings.AUTH_USER_MODEL),
        ),
    ]
