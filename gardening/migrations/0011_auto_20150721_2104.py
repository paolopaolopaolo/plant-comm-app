# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0010_auto_20150721_2047'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='plant',
            field=models.ForeignKey(default=None, to='gardening.Plant', null=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='plant_img',
            field=models.ForeignKey(default=None, to='gardening.PlantImg', null=True),
        ),
    ]
