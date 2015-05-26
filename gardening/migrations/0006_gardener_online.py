# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0005_auto_20150511_2259'),
    ]

    operations = [
        migrations.AddField(
            model_name='gardener',
            name='online',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
    ]
