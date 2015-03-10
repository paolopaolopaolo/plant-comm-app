# REST DJANGO FRAMEWORK IMPLEMENTATION
# SERIALIZERS ARE JUST LIKE FORMS, BUT ASYNC

from rest_framework import serializers
from gardening.models import *
from django.contrib.auth.models import User
from django.forms import widgets

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('id',)

class GardenerSerializer(serializers.ModelSerializer):
	class Meta:
		model = Gardener
		fields = ( 'id',
				   'first_name',
				   'last_name',
				   'text_blurb',
				   'city',
				   'state',
				   'zipcode',
				   'available')


class PlantSerializer(serializers.ModelSerializer):
	id = serializers.IntegerField(required=False)
	information = serializers.CharField(allow_blank=True)
	species = serializers.CharField(allow_blank=True)
	quantity = serializers.IntegerField(required=False)
	class Meta:
		model = Plant
		fields = ( 'id',
				   'user',
				   'species',
				   'quantity',
				   'information')

	def create(self, validated_data):
		newplant = Plant.objects.create(**validated_data)
		return newplant

class PlantImgSerializer(serializers.ModelSerializer):
	id = serializers.IntegerField(required = False)
	image = serializers.ImageField(allow_empty_file = True, use_url = True, read_only = True)
	class Meta:
		model = PlantImg
		fields = ( 'id',
				   'plant',
				   'image')
