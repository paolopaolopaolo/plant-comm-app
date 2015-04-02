# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import gardening.models


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0014_auto_20150330_1825'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plantimg',
            name='image',
            field=models.ImageField(default=None, null=True, upload_to=gardening.models.plant_path),
        ),
    ]
