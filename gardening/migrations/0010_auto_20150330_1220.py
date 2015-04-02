# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0009_auto_20150330_1218'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='available',
            field=models.NullBooleanField(default=False),
        ),
    ]
