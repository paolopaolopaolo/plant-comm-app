# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gardening', '0007_auto_20150330_1141'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gardener',
            name='city',
            field=models.CharField(default=b'', max_length=100, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='first_name',
            field=models.CharField(default=b'', max_length=50, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='last_name',
            field=models.CharField(default=b'', max_length=50, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='state',
            field=models.CharField(blank=True, max_length=2, null=True, choices=[(b'AK', b'Alaska'), (b'AL', b'Alabama'), (b'AR', b'Arkansas'), (b'AS', b'American Samoa'), (b'AZ', b'Arizona'), (b'CA', b'California'), (b'CO', b'Colorado'), (b'CT', b'Connecticut'), (b'DC', b'District of Columbia'), (b'DE', b'Delaware'), (b'FL', b'Florida'), (b'GA', b'Georgia'), (b'GU', b'Guam'), (b'HI', b'Hawaii'), (b'IA', b'Iowa'), (b'ID', b'Idaho'), (b'IL', b'Illinois'), (b'IN', b'Indiana'), (b'KS', b'Kansas'), (b'KY', b'Kentucky'), (b'LA', b'Louisiana'), (b'MA', b'Massachusetts'), (b'MD', b'Maryland'), (b'ME', b'Maine'), (b'MI', b'Michigan'), (b'MN', b'Minnesota'), (b'MO', b'Missouri'), (b'MP', b'Northern Mariana Islands'), (b'MS', b'Mississippi'), (b'MT', b'Montana'), (b'NA', b'National'), (b'NC', b'North Carolina'), (b'ND', b'North Dakota'), (b'NE', b'Nebraska'), (b'NH', b'New Hampshire'), (b'NJ', b'New Jersey'), (b'NM', b'New Mexico'), (b'NV', b'Nevada'), (b'NY', b'New York'), (b'OH', b'Ohio'), (b'OK', b'Oklahoma'), (b'OR', b'Oregon'), (b'PA', b'Pennsylvania'), (b'PR', b'Puerto Rico'), (b'RI', b'Rhode Island'), (b'SC', b'South Carolina'), (b'SD', b'South Dakota'), (b'TN', b'Tennessee'), (b'TX', b'Texas'), (b'UT', b'Utah'), (b'VA', b'Virginia'), (b'VI', b'Virgin Islands'), (b'VT', b'Vermont'), (b'WA', b'Washington'), (b'WI', b'Wisconsin'), (b'WV', b'West Virginia'), (b'WY', b'Wyoming')]),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='text_blurb',
            field=models.CharField(default=b'', max_length=700, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='gardener',
            name='zipcode',
            field=models.CharField(default=b'', max_length=5, null=True, blank=True),
        ),
    ]
