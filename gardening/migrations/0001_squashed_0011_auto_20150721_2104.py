# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
import gardening.models
from django.conf import settings


class Migration(migrations.Migration):

    replaces = [(b'gardening', '0001_initial'), (b'gardening', '0002_convo'), (b'gardening', '0003_convo_active'), (b'gardening', '0004_convo_seen'), (b'gardening', '0005_auto_20150511_2259'), (b'gardening', '0006_gardener_online'), (b'gardening', '0007_content'), (b'gardening', '0008_content_page'), (b'gardening', '0009_auto_20150721_0215'), (b'gardening', '0010_auto_20150721_2047'), (b'gardening', '0011_auto_20150721_2104')]

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Gardener',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('username', models.CharField(default=b'', max_length=50)),
                ('first_name', models.CharField(default=b'', max_length=50)),
                ('last_name', models.CharField(default=b'', max_length=50)),
                ('profile_pic', models.ImageField(null=True, upload_to=gardening.models.profile_path)),
                ('city', models.CharField(default=b'', max_length=100)),
                ('state', models.CharField(max_length=2, choices=[(b'AK', b'Alaska'), (b'AL', b'Alabama'), (b'AR', b'Arkansas'), (b'AS', b'American Samoa'), (b'AZ', b'Arizona'), (b'CA', b'California'), (b'CO', b'Colorado'), (b'CT', b'Connecticut'), (b'DC', b'District of Columbia'), (b'DE', b'Delaware'), (b'FL', b'Florida'), (b'GA', b'Georgia'), (b'GU', b'Guam'), (b'HI', b'Hawaii'), (b'IA', b'Iowa'), (b'ID', b'Idaho'), (b'IL', b'Illinois'), (b'IN', b'Indiana'), (b'KS', b'Kansas'), (b'KY', b'Kentucky'), (b'LA', b'Louisiana'), (b'MA', b'Massachusetts'), (b'MD', b'Maryland'), (b'ME', b'Maine'), (b'MI', b'Michigan'), (b'MN', b'Minnesota'), (b'MO', b'Missouri'), (b'MP', b'Northern Mariana Islands'), (b'MS', b'Mississippi'), (b'MT', b'Montana'), (b'NA', b'National'), (b'NC', b'North Carolina'), (b'ND', b'North Dakota'), (b'NE', b'Nebraska'), (b'NH', b'New Hampshire'), (b'NJ', b'New Jersey'), (b'NM', b'New Mexico'), (b'NV', b'Nevada'), (b'NY', b'New York'), (b'OH', b'Ohio'), (b'OK', b'Oklahoma'), (b'OR', b'Oregon'), (b'PA', b'Pennsylvania'), (b'PR', b'Puerto Rico'), (b'RI', b'Rhode Island'), (b'SC', b'South Carolina'), (b'SD', b'South Dakota'), (b'TN', b'Tennessee'), (b'TX', b'Texas'), (b'UT', b'Utah'), (b'VA', b'Virginia'), (b'VI', b'Virgin Islands'), (b'VT', b'Vermont'), (b'WA', b'Washington'), (b'WI', b'Wisconsin'), (b'WV', b'West Virginia'), (b'WY', b'Wyoming')])),
                ('zipcode', models.CharField(default=b'', max_length=5)),
                ('text_blurb', models.CharField(default=b'', max_length=700)),
                ('available', models.BooleanField(default=False)),
                ('favorites', models.ManyToManyField(to=b'gardening.Gardener')),
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
                ('periodic', models.BooleanField(default=False)),
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
                ('information', models.TextField(default=b'', null=True, blank=True)),
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
                ('image', models.ImageField(default=None, null=True, upload_to=gardening.models.plant_path)),
                ('thumbnail', models.ImageField(default=None, null=True, upload_to=b'plant_img_thumbnails/', blank=True)),
                ('plant', models.ForeignKey(to='gardening.Plant')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Convo',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text', models.TextField()),
                ('time_initiated', models.DateTimeField(auto_now=True)),
                ('user_a', models.ForeignKey(related_name=b'+', to='gardening.Gardener')),
                ('user_b', models.ForeignKey(related_name=b'+', to='gardening.Gardener')),
                ('active', models.BooleanField(default=True)),
                ('seen_a', models.BooleanField(default=False)),
                ('seen_b', models.BooleanField(default=False)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='gardener',
            name='online',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
        migrations.CreateModel(
            name='Content',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('descriptor', models.CharField(default=b'', max_length=20)),
                ('content', models.TextField(default=b'')),
                ('page', models.CharField(default=b'NA', max_length=2, choices=[(b'LA', b'Landing Page'), (b'PR', b'Profile Page'), (b'FE', b'Feed Page'), (b'NA', b'Unassigned')])),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text', models.TextField()),
                ('job', models.ForeignKey(to='gardening.Job')),
                ('time', models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 0, 785605), auto_now=True)),
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
                ('plant', models.ForeignKey(default=None, to='gardening.Plant', null=True)),
                ('plant_img', models.ForeignKey(default=None, to='gardening.PlantImg', null=True)),
                ('user', models.ForeignKey(to='gardening.Gardener')),
                ('time_happened', models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 15, 205926), auto_now=True)),
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
        migrations.AddField(
            model_name='job',
            name='time',
            field=models.DateTimeField(default=datetime.datetime(2015, 7, 21, 20, 47, 26, 941306), auto_now=True),
            preserve_default=False,
        ),
    ]
