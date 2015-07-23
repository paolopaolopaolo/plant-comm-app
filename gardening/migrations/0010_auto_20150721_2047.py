# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0009_auto_20150721_0215'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 0, 785605), auto_now=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='event',
            name='time_happened',
            field=models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 15, 205926), auto_now=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='job',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 26, 941306), auto_now=True),
            preserve_default=False,
        ),
    ]
