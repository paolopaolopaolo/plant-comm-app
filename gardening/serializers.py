# REST DJANGO FRAMEWORK IMPLEMENTATION
# SERIALIZERS ARE JUST LIKE FORMS, BUT ASYNC

from rest_framework import serializers
from gardening.models import *
from django.contrib.auth.models import User
from django.forms import widgets

import re



class GardenerSerializer(serializers.ModelSerializer):
	username = serializers.CharField(allow_blank = True, required = False)
	profile_pic = serializers.CharField(allow_blank = True, required = False)
	first_name = serializers.CharField(allow_blank = True, required = False)
	last_name = serializers.CharField(allow_blank = True, required = False)
	city = serializers.CharField(allow_blank = True, required = False)
	state = serializers.CharField(allow_blank = True, required = False)
	zipcode = serializers.CharField(max_length = 5, min_length = 5, allow_blank = True, required = False)
	text_blurb = serializers.CharField(max_length = 700, allow_blank = True, required = False)
	class Meta:
		model = Gardener
		fields = ( 'id',
				   'username',
				   'first_name',
				   'last_name',
				   'profile_pic',
				   'online',
				   'text_blurb',
				   'city',
				   'state',
				   'zipcode',
				   'available')

class PlantImgSerializer(serializers.ModelSerializer):
	id = serializers.IntegerField(required = False)
	image = serializers.ImageField(allow_empty_file = True, use_url = True, read_only = True)

	class Meta:
		model = PlantImg
		fields = ( 'id',
				   'plant',
				   'image')


class PlantSerializer(serializers.ModelSerializer):
	id = serializers.IntegerField(required = False)
	information = serializers.CharField(allow_blank = False)
	species = serializers.CharField(allow_blank = False)
	quantity = serializers.IntegerField(required = False)
	

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

class ImageSerializer(serializers.Serializer):
	id = serializers.IntegerField(required = False)
	imageURL = serializers.CharField(allow_blank = True, required = False)

# class TestSerializer(serializers.Serializer):
# 	id = serializers.IntegerField(required = False)
# 	image = serializers.CharField(allow_blank = True, required = False)
class CompoundPlantSerializer(serializers.Serializer):
	id = serializers.IntegerField(required = False)
	plant = PlantSerializer()
	imgs = ImageSerializer(many = True, required = False)

class GardenerPlantSerializer(serializers.Serializer):
	available = serializers.BooleanField(required = False)
	online = serializers.BooleanField(required = False)
	username = serializers.CharField(allow_blank = True, required = False)
	profile_pic = serializers.CharField(allow_blank = True, required = False)
	text_blurb = serializers.CharField(allow_blank = False)
	id = serializers.IntegerField(required = False)
	first_name = serializers.CharField(allow_blank = True, required = False)
	last_name = serializers.CharField(allow_blank = True, required = False)
	city = serializers.CharField(allow_blank = True, required = False)
	state = serializers.ChoiceField(STATE_ABBREVS, required = False)
	zipcode = serializers.CharField(allow_blank = True, required = False)
	plants = CompoundPlantSerializer(many = True)

class ConvoSerializer(serializers.Serializer):
	text = serializers.CharField(allow_blank = True, required = True)


class CommentSerializer(serializers.Serializer):
	user = GardenerSerializer()
	time = serializers.CharField()
	text = serializers.CharField(allow_blank = False, required = True) 

class JobsSerializer(serializers.Serializer):
	user = GardenerSerializer()
	comment = CommentSerializer(many=True, required = False)
	time = serializers.CharField()
	text_description = serializers.CharField(allow_blank = False, required = True) 

class EventsSerializer(serializers.ModelSerializer):
	user = GardenerSerializer()
	plant = PlantSerializer(required = False)
	plant_img = PlantImgSerializer(required = False)
	class Meta:
		model = Event
		fields = ('id',
				  'user',
				  'plant',
				  'plant_img',
				  'time_happened',
				  'event')