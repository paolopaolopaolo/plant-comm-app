# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0008_content_page'),
    ]

    operations = [
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text', models.TextField()),
                ('job', models.ForeignKey(to='gardening.Job')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('event', models.CharField(max_length=3, choices=[(b'NP', b'new plant'), (b'NI', b'new plant image'), (b'CL', b'change location'), (b'CU', b'change username'), (b'CN', b'change name'), (b'CP', b'change profile picture')])),
                ('plant', models.ForeignKey(default=None, to='gardening.Plant')),
                ('plant_img', models.ForeignKey(default=None, to='gardening.PlantImg')),
                ('user', models.ForeignKey(to='gardening.Gardener')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.RemoveField(
            model_name='job',
            name='end_date',
        ),
        migrations.RemoveField(
            model_name='job',
            name='periodic',
        ),
        migrations.RemoveField(
            model_name='job',
            name='start_date',
        ),
        migrations.AlterField(
            model_name='job',
            name='user',
            field=models.ForeignKey(to='gardening.Gardener'),
        ),
    ]
