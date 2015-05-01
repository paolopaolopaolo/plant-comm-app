# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0002_convo'),
    ]

    operations = [
        migrations.AddField(
            model_name='convo',
            name='active',
            field=models.BooleanField(default=True),
            preserve_default=True,
        ),
    ]
