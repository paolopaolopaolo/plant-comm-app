# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Convo',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text', models.TextField()),
                ('time_initiated', models.DateTimeField(auto_now=True)),
                ('user_a', models.ForeignKey(related_name=b'+', to='gardening.Gardener')),
                ('user_b', models.ForeignKey(related_name=b'+', to='gardening.Gardener')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
