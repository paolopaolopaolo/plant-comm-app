# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='text_blurb',
            field=models.CharField(default=b'', max_length=700),
        ),
    ]
