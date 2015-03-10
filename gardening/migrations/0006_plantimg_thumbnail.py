# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0005_auto_20150323_1036'),
    ]

    operations = [
        migrations.AddField(
            model_name='plantimg',
            name='thumbnail',
            field=models.ImageField(default=None, null=True, upload_to=b'plant_img_thumbnails/', blank=True),
            preserve_default=True,
        ),
    ]
