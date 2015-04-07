# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0011_auto_20150330_1225'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='favorites',
            field=models.ManyToManyField(to=b'gardening.Gardener'),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='user',
            field=models.OneToOneField(to=settings.AUTH_USER_MODEL),
        ),
    ]
