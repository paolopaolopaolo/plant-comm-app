# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import gardening.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Gardener',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('profile_pic', models.ImageField(upload_to=gardening.models.profile_path)),
                ('text_blurb', models.CharField(max_length=700)),
                ('available', models.BooleanField(default=False)),
                ('favorites', models.ManyToManyField(to='gardening.Gardener')),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Job',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text_description', models.CharField(max_length=700)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('user', models.OneToOneField(to='gardening.Gardener')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Plant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('species', models.CharField(max_length=200)),
                ('quantity', models.IntegerField(default=1)),
                ('information', models.TextField()),
                ('user', models.ForeignKey(to='gardening.Gardener')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='PlantImg',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('plant', models.ForeignKey(to='gardening.Plant')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
