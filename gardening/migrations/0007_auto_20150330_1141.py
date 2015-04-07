# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0006_plantimg_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='gardener',
            name='first_name',
            field=models.CharField(default=b'', max_length=50),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='gardener',
            name='last_name',
            field=models.CharField(default=b'', max_length=50),
            preserve_default=True,
        ),
    ]
