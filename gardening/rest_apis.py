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
from gardening.pagination_classes import EventsPagination
from gardening.views import GreenThumbPage

from rest_framework import mixins, generics
from rest_framework.renderers import JSONRenderer
from PIL import Image
import json, re, requests, pdb, datetime

from gardening.decorators import *

### ZipCodeApi Wrapper ###
class ZipCodeAPI(GreenThumbPage):
	def get(self, request, *args, **kwargs):
		zca_url = settings.ZIPCODE_API_URL
		option = request.GET["option"]
		zipcode = request.GET["zipcode"]
		if option == "info.json":
			target = '/'.join([zca_url, option, zipcode, "/degrees"])
			result = json.dumps(requests.get(target).json())
		elif option == "city-zips.json":
			city = request.GET["city"]
			state = request.GET["state"]
			target = '/'.join([zca_url, option, city, state])
			try:
				result = json.dumps({"zipcode": requests.get(target).json()["zip_codes"][0]})
			except Exception:
				result = json.dumps([])
		return HttpResponse(result, content_type="application/json")

### Shared Page REST APIs ###

class SearchAPI(GreenThumbPage, mixins.ListModelMixin, generics.GenericAPIView):
	
	serializer_class = GardenerPlantSerializer

	@set_user_and_gardener_and_convos
	@setGardenerPlantQueryset
	def get(self, request, *args, **kwargs):

		def filterFunction(query):
			def check_each_term(term, strings):
				for string in strings:
					if term in string:
						return True
				return False

			query_term = request.GET["query"].lower()
			plants = [plant["plant"] for plant in query.plants]
			plant_names = [plant.species.lower() for plant in plants]
			plant_infos = [plant.information.lower() for plant in plants]

			test1 = query_term in query.username.lower()
			test2 = query_term in query.first_name.lower()
			test3 = query_term in query.last_name.lower()
			test4 = check_each_term(query_term, plant_names)
			test5 = check_each_term(query_term, plant_infos)
			test6 = query_term in query.city.lower()

			return test1 or test2 or test3 or test4 or test5 or test6

		self.queryset = filter(filterFunction, self.queryset)
		results = [self.serializer_class(query).data for query in self.queryset]
		context = {
						"followers": json.dumps(self.RETURN_FOLLOWER_DATA()),
						"other_gardeners_object": json.dumps(results),
						"query": request.GET["query"],
						"media_url": settings.MEDIA_URL,
						"compress_enabled": settings.COMPRESS_ENABLED,
						"convos": json.dumps(self.convos),
						"user": request.user,
						"search_results": results,
						"search_results_length": len(results),
						"showsFooter": True,
						"isAuthenticated": request.user.is_authenticated(),
				  }
		if self.gardener is not None:
			context["header_profile_pic"] = self.gardener.profile_pic

		return render(request, "gardening/search_page/search_page.html", context)

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
				event = Event(user = self.gardener, event="CP")
				event.save()
				url_target = self.gardener.profile_pic.url
				response = json.dumps({'profile_pic': url_target})
				return HttpResponse(response, content_type='application/json')
		return self.create(self, request, *args, **kwargs)

	@set_user
	def put(self, request, *args, **kwargs):
		self.data = request.data
		# Change UAuth User object instance as well
		if "first_name" in self.data:
			self.user.first_name = self.data["first_name"]
		if "last_name" in self.data:
			self.user.last_name = self.data["last_name"]
		if "username" in self.data:
			event = Event(user = self.gardener, event = "CU")
			self.user.username = self.data["username"]
		try:
			self.user.save()
		except IntegrityError:
			response = {'username': 'Username already taken.'}
			return HttpResponseServerError(json.dumps(response), content_type='application/json')

		# Check for differences from past data. If there's a difference, save an Event
		
		# Check name
		namecheck = not (self.gardener.first_name == self.data["first_name"]) 
		namecheck = namecheck or not (self.gardener.last_name == self.data["last_name"])

		#Check username
		unamecheck = not(self.gardener.username == self.data["username"])

		#Check Location
		loccheck = not(self.gardener.city == self.data["city"])
		loccheck = loccheck or not (self.gardener.state == self.data["state"])
		loccheck = loccheck or not (self.gardener.zipcode == self.data["zipcode"])

		if namecheck:
		   	event = Event(user = self.gardener, event = "CN")
			event.save()

		if unamecheck: 
			event = Event(user = self.gardener, event = "CU")
			event.save()

		if loccheck:
			event = Event(user = self.gardener, event = "CL")
			event.save()

		# Updates everything
		return self.update(self, request, *args, **kwargs)


# Handles plant data		
class PlantAPI( mixins.RetrieveModelMixin,
				mixins.ListModelMixin,
				mixins.CreateModelMixin,
				mixins.UpdateModelMixin,
				mixins.DestroyModelMixin,
				generics.GenericAPIView):

	queryset = Plant.objects.all()
	serializer_class = PlantSerializer
	lookup_field = 'id'


	def create(self, request, *args, **kwargs):
		newplantserial = PlantSerializer(data = self.data)
		if newplantserial.is_valid():
			newplant = Plant(
				user = kwargs['gardener'],
				species = newplantserial.validated_data['species'],
				quantity = newplantserial.validated_data['quantity'],
				information = newplantserial.validated_data['information']
			)
			try:
				newplant.save()
			except Exception, e:
				return HttpResponseServerError(str(e), content_type='text/plain')
			event = Event(user = kwargs['gardener'], plant = newplant, event = "NP")
			event.save()
			response = HttpResponse(json.dumps(model_to_dict(newplant)), content_type='application/json')
			return response
		return HttpResponseServerError(json.dumps(newplantserial.errors), content_type='application/json')

	@setApiUser
	def get(self, request, *args, **kwargs):
		# If url is /profile/plant/(nothing)
		# return all of the Plant entries 
		# of that user
		if 'id' not in kwargs:
			response = self.queryset.filter(user = self.data['user'])
			response = json.dumps([model_to_dict(entry) for entry in response])
			return HttpResponse(response, content_type='application/json')

		self.queryset = self.queryset.filter(user = kwargs['id'])
		# Else, retrieve the appropriate plant
		return self.list(self, request, *args, **kwargs)

	@setApiUser
	@method_decorator(login_required)
	def post(self, request, *args, **kwargs):
		gardener = Gardener.objects.get(id=self.data['user'])
		kwargs['gardener'] = gardener
		return self.create(self, request, *args, **kwargs)

	@setApiUser
	@method_decorator(login_required)
	def put(self, request, *args, **kwargs):
		return self.update(self, request, *args, **kwargs)
	
	@setApiUser
	@method_decorator(login_required)
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
		event = Event(user=newplantimg.plant.user, plant=newplantimg.plant, plant_img=newplantimg, event="NI")
		event.save()
		return HttpResponse(response, status = 201, content_type='application/json')

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(PlantImgAPI, self).dispatch(*args, **kwargs)

	@setApiPlant
	def get(self, request, *args, **kwargs):
		# If url is /profile/plantimg/(nothing)
		# return all of the PlantImg entries 
		# of that plant
		if 'id' not in self.data:
			response = self.queryset.filter(plant = kwargs['id'])
			try:
				response = json.dumps([{'id': entry.id, 'imageURL': entry.thumbnail.url } for entry in response])
			except Exception, e:
				response = json.dumps([{'id': entry.id, 'imageURL': entry.thumbnail.name } for entry in response])
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

class EventsAPI(GreenThumbPage, mixins.ListModelMixin, generics.GenericAPIView ):

	serializer_class = EventsSerializer
	queryset = Event.objects.all()
	pagination_class = EventsPagination

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(EventsAPI, self).dispatch(*args, **kwargs)

	@set_user
	def get(self, request, *args, **kwargs):
		# Filter out all instances of self in queryset
		self.queryset = self.queryset.exclude(user = self.gardener.id)
		# Special sort
		self.queryset = self.event_sort(self.queryset)
		return self.list(self, request, *args, **kwargs)

class JobsAPI(GreenThumbPage,
			  mixins.ListModelMixin,
			  mixins.CreateModelMixin,
			  mixins.UpdateModelMixin,
			  generics.GenericAPIView):

	lookup_field = 'id'
	serializer_class = JobsSerializer
	pagination_class = EventsPagination

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(JobsAPI, self).dispatch(*args, **kwargs)

	@set_user
	def get(self, request, *args, **kwargs):
		self.queryset = [json.loads(job) for job in self.RETURN_JOB_DATA()]
		return self.list(self, request, *args, **kwargs)

	@setApiUser
	def post(self, request, *args, **kwargs):
		# pdb.set_trace()
		self.data['user'] = model_to_dict(Gardener.objects.get(id = self.data['user']))
		# pdb.set_trace()
		self.data['time'] = datetime.datetime.now().isoformat()
		return self.create(self, request, *args, **kwargs)

	def update(self, request, *args, **kwargs):
		serial_comment = CommentSerializer(data = kwargs['data'])
		if serial_comment.is_valid():
			response = model_to_dict(serial_comment.validated_data['job'])
			response['user'] = model_to_dict(Gardener.objects.get(id = response['user']))
			response['comment'] = list(Comment.objects.filter(job = response['id']))
			pdb.set_trace()
			# JobsSerializer(data = response)
			return HttpResponse(json.dumps(response), content_type="application/json")
		return HttpResponse(json.dumps(serial_comment.error), content_type="application/json")

	@setApiUser
	def put(self, request, *args, **kwargs):
		target_data = {}
		target_data['job'] = kwargs['id']
		target_data['user'] = model_to_dict(Gardener.objects.get(id = self.data['user']))
		target_data['time'] = datetime.datetime.now().isoformat()
		target_data['text'] = request.data['comment'][-1]['text']
		kwargs['data'] = target_data
		return self.update(self, request, *args, **kwargs)

class CommentsAPI(GreenThumbPage,
			  	  mixins.ListModelMixin,
			  	  mixins.CreateModelMixin,
			  	  generics.GenericAPIView):
	pass