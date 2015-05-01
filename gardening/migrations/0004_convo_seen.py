# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0003_convo_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='convo',
            name='seen',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
    ]
