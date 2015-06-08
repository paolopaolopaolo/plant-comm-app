# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0007_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='content',
            name='page',
            field=models.CharField(default=b'NA', max_length=2, choices=[(b'LA', b'Landing Page'), (b'PR', b'Profile Page'), (b'FE', b'Feed Page'), (b'NA', b'Unassigned')]),
            preserve_default=True,
        ),
    ]
