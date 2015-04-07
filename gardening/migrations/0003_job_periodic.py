# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0002_auto_20150305_1542'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='periodic',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
    ]
