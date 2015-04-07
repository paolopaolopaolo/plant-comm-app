# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0010_auto_20150330_1220'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='favorites',
            field=models.ManyToManyField(to=b'gardening.Gardener', null=True),
        ),
    ]
