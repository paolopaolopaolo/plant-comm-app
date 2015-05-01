# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0004_convo_seen'),
    ]

    operations = [
        migrations.RenameField(
            model_name='convo',
            old_name='seen',
            new_name='seen_a',
        ),
        migrations.AddField(
            model_name='convo',
            name='seen_b',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
    ]
