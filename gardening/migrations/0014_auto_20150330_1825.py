# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0013_auto_20150330_1321'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plant',
            name='information',
            field=models.TextField(default=b'', null=True, blank=True),
        ),
    ]
