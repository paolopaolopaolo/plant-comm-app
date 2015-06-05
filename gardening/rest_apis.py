from django.shortcuts import render, redirect
from django.utils.datastructures import MultiValueDictKeyError
from django.contrib.auth import login, authenticate, logout
from django.http import HttpResponse, HttpResponseServerError
from django.views.generic import View, TemplateView
from gardening.forms import *
from gardening.models import *
from gardening.serializers import *
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.views import APIView
from django.forms.models import model_to_dict
from django.db import IntegrityError
from django.core.exceptions import SuspiciousOperation
from rest_framework.pagination import PageNumberPagination

from rest_framework import mixins
from rest_framework import generics
from PIL import Image
import json, re

from gardening.decorators import *
### Profile Page REST APIs ###

# Handle gardener data in profile page API
class GardenerAPI( mixins.RetrieveModelMixin,
				   mixins.CreateModelMixin,
				   mixins.UpdateModelMixin,
				   generics.GenericAPIView):

	queryset = Gardener.objects.all()
	serializer_class = GardenerSerializer
	lookup_field = 'id'

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(GardenerAPI, self).dispatch(*args, **kwargs)

	@setApiUser
	def get(self, request, *args, **kwargs):
		return self.retrieve(self, request, *args, **kwargs)

	@set_user
	def post(self, request, *args, **kwargs):
		self.data = request.data
		if kwargs['id'] == 'pic':
			# use profile form to process profile pics
			profile_form = ProfileForm(request.POST, request.FILES)
			if profile_form.is_valid():
				self.gardener.profile_pic = profile_form.cleaned_data['profile_pic']
				self.gardener.save()
				url_target = self.gardener.profile_pic.url
				response = json.dumps({'profile_pic': url_target})
				return HttpResponse(response, content_type='application/json')
		return self.create(self, request, *args, **kwargs)

	@set_user
	def put(self, request, *args, **kwargs):
		self.data = request.data
		if "first_name" in self.data:
			self.user.first_name = self.data["first_name"]
		if "last_name" in self.data:
			self.user.last_name = self.data["last_name"]
		if "username" in self.data:
			self.user.username = self.data["username"]
		try:
			self.user.save()
		except IntegrityError:
			response = {'username': 'Username already taken.'}
			return HttpResponseServerError(json.dumps(response), content_type='application/json')
		return self.update(self, request, *args, **kwargs)


# Handles plant data		
class PlantAPI( mixins.RetrieveModelMixin,
				mixins.CreateModelMixin,
				mixins.UpdateModelMixin,
				mixins.DestroyModelMixin,
				generics.GenericAPIView):

	queryset = Plant.objects.all()
	serializer_class = PlantSerializer
	lookup_field = 'id'

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(PlantAPI, self).dispatch(*args, **kwargs)

	@setApiUser
	def get(self, request, *args, **kwargs):
		# If url is /profile/plant/(nothing)
		# return all of the Plant entries 
		# of that user
		if 'id' not in self.data:
			response = self.queryset.filter(user = self.data['user'])
			response = json.dumps([model_to_dict(entry) for entry in response])
			return HttpResponse(response, content_type='application/json')
		# Else, retrieve the appropriate plant
		return self.retrieve(self, request, *args, **kwargs)

	@setApiUser
	def post(self, request, *args, **kwargs):
		return self.create(self, request, *args, **kwargs)

	@setApiUser
	def put(self, request, *args, **kwargs):
		return self.update(self, request, *args, **kwargs)
	
	@setApiUser
	def delete(self, request, *args, **kwargs):
		return self.destroy(self, request, *args, **kwargs)

# Handles plant images
class PlantImgAPI( mixins.CreateModelMixin,
				   mixins.DestroyModelMixin,
				   mixins.RetrieveModelMixin,
				   generics.GenericAPIView):

	queryset = PlantImg.objects.all()
	serializer_class = PlantImgSerializer
	lookup_field = 'id'

	# Override create function to handle adding images
	def create(self, request, *args, **kwargs):
		serialized_data = PlantImgSerializer(data = self.data)
		if serialized_data.is_valid():
			newplantimg = PlantImg(
				plant = serialized_data.validated_data['plant'],
				image = self.data['image']
			)
		try:
			newplantimg.save()
		except Exception, e:
			return HttpResponseServerError(str(e), content_type='text/plain')
		response = json.dumps({
				'id': newplantimg.id,
				'imageURL': newplantimg.thumbnail.url
			})

		return HttpResponse(response, status = 201, content_type='application/json')

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(PlantImgAPI, self).dispatch(*args, **kwargs)

	@setApiPlant
	def get(self, request, *args, **kwargs):
		# If url is /profile/plantimg/(nothing)
		# return all of the PlantImg entries 
		# of that plant
		def urlToGet(entry):
			url_to_get = ""
			try:
				url_to_get = entry.thumbnail.url
			except Exception:
				url_to_get = os.path.join(
								"https://plantappstorage.s3.amazonaws.com/media",
								entry.thumbnail.name
							)
			return url_to_get
			
		if 'id' not in self.data:
			response = self.queryset.filter(plant = kwargs['id'])
			response = json.dumps([{'id': entry.id, 'imageURL': urlToGet(entry) } for entry in response])
			return HttpResponse(response, content_type='application/json')
		return self.retrieve(self, request, *args, **kwargs)

	@setApiPlant
	def post(self, request, *args, **kwargs):
		return self.create(self, request, *args, **kwargs)

	def delete(self, request, *args, **kwargs):
		return self.destroy(self, request, *args, **kwargs)

### Feed Page APIs ###

# Condenses all the information about
# other gardeners 
class OtherGardenerAPI( mixins.RetrieveModelMixin,
						mixins.ListModelMixin,
						generics.GenericAPIView):
	# Primary lookup will be through gardener
	lookup_field = 'id'
	serializer_class = GardenerPlantSerializer

	def retrieve(self, request, *args, **kwargs):
		data = filter(lambda x: x.id == int(kwargs['id']), self.queryset)[0]
		thing = self.serializer_class(data = model_to_dict(data))
		print model_to_dict(data)
		print thing.is_valid()
		print thing.validated_data

	@set_user
	@setGardenerPlantQueryset
	def get(self, request, *args, **kwargs):
		self.pagination_class = None
		if kwargs['id'] is None:
			if 'page' in request.GET:
				self.pagination_class = PageNumberPagination
			return self.list(self, request, *args, **kwargs)
		return self.retrieve(self, request, *args, **kwargs)

class CompoundGardenerPlant():
	available = False
	profile_pic = ""
	text_blurb = ""
	id = None
	first_name = ""
	last_name = ""
	city = ""
	state = ""
	zipcode = None
	plants = []


class JobSetAPI(View):
	pass
