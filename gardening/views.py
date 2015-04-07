from django.shortcuts import render, redirect
from django.utils.datastructures import MultiValueDictKeyError
from django.contrib.auth import login, authenticate, logout
from django.http import HttpResponse
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

from rest_framework import mixins
from rest_framework import generics
from PIL import Image

import json, os, StringIO, re

## Function based views ##

# Logs user out and returns
# to landing page
def log_out(request):
	logout(request)
	return redirect('landing')

## Decorators ##

# Sets user/gardener/plant objects 
# for ProfilePage GET method 
def set_user(method):
	def setting_user(*args, **kwargs):
		self = args[0]
		request = args[1]
		self.user = User.objects.get(username = request.user)
		self.gardener = Gardener.objects.get(user = self.user)
		self.plants = Plant.objects.filter(user = self.gardener)
		return method(*args, **kwargs)
	return setting_user

# Sets the user attribute for PlantAPI
def setApiUser(method):
	def wrapper(*args, **kwargs):
		self = args[0]
		request = args[1]
		# print request.data
		data_to_set = request.data.copy()
		user_to_post = User.objects.get(username = request.user)
		user_to_post = Gardener.objects.get(user = user_to_post)
		data_to_set['user'] = user_to_post.id
		self.data = data_to_set
		return method(*args, **kwargs)
	return wrapper

# Sets the plant attribute for PlantImgAPI
def setApiPlant(method):
	def wrapper(*args, **kwargs):
		self = args[0]
		request = args[1]
		data_to_set = {}
		# print 'request.data (line 403):'
		# print request.data
		if 'id' in request.data:
			plant_to_post = Plant.objects.get(id = int(request.data['id']))
			data_to_set['plant'] = plant_to_post.id
			data_to_set['image'] = request.data['image']
		# print 'data_to_set (line 407):'
		# print data_to_set
		self.data = data_to_set
		return method(*args, **kwargs)
	return wrapper

# Decorator: sets queryset to be a 
# new view that adds plant information
# to the gardener
def setGardenerPlantQueryset(limit = None, preFilter = None):
	def wrapper0(method):
		def wrapper1(*args, **kwargs):
			self = args[0]
			request = args[1]

			def filterMethod(queryset_member):
				return not (self.gardener.id == queryset_member.id)

			if preFilter is not None:
				gardeners = preFilter(Gardener.objects.all())

			else:
				gardeners = Gardener.objects.all()

			if limit is None or len(gardeners) < limit:
				self.queryset = filter(filterMethod, gardeners)
			else:
				self.queryset = filter(filterMethod, gardeners)[0: limit]
			for model in self.queryset:
				model.plants = []
				for plant in Plant.objects.filter(user = model.id):
					result_obj = {}
					result_obj['plant'] = plant
					result_obj['imgs'] = []
					plantimgs = PlantImg.objects.filter(plant = plant.id)
					for plantimg in plantimgs:
						result_obj['imgs'].append({ 
									'id': plantimg.id,
									'imageURL': re.sub(r'\\', '/',os.path.join(
										settings.DOMAIN,
										'media',
										plantimg.image.url
									))})
					model.plants.append(result_obj)
			# self.data = self.queryset
			return method(self, request, *args, **kwargs)
		return wrapper1
	return wrapper0

# Landing page (for signing up/logging in)
class LandingPage(View):
	context = {
				"signinform": SignUpForm(),
				"loginform": LogInForm()
			  }

	# Just pull up the webpage
	def get(self, request):
		return render(request, "landing_page.html", self.context)

	def post(self, request):
		# Get form results based on what is in POST
		# Below: Signup Procedure
		if "confirm_password" in request.POST:
			signupform = SignUpForm(request.POST)
			# Clean up form and validate results
			if signupform.is_valid():
				# Set variable storing cleaned_data
				form_data = signupform.cleaned_data

				# if form has valid data, create user and 
				# gardener instance and redirect to the profile page
				user = User.objects.create_user(
							email = form_data.get('email').lower(),
							username = form_data.get('username').lower(),
							first_name = form_data.get('first_name'),
							last_name = form_data.get('last_name'), 
							password = form_data.get('password') 
						)
				garden_user = Gardener(user = user)
				garden_user.save()
				# Authenticate and login this new user
				auth_user = authenticate(
								username = form_data.get('username'),
								password = form_data.get('password')
							)
				login(request, auth_user)
				# redirect to profile with user
				return redirect("profile")
			# Feed error message to the view context
			message = signupform.error_message
			self.context["error_message"] = message
			return render(request, "landing_page.html", self.context)
		# Below: Login Procedure
		else:
			loginform = LogInForm(request.POST)
			# Validate POST and then authenticate
			if loginform.is_valid():
				# Built-in method authenticates the user
				user = loginform.auth_user()
				# Login user to feed page once authenticated
				if user is not None:
					# Redirect users to feed page
					login(request, user)
					return redirect("feed")
				message = "Invalid Email/Password combination Try again"
				self.context["error_message"] = message
				return render(request, "landing_page.html", self.context)
			message = "Please use a valid email."
			self.context["error_message"] = message
			return render(request, "landing_page.html", self.context)

# Profile Page: Edit the profile
class ProfilePage(APIView):
	user = None
	gardener = None
	plants = None
	cleaned_data = {}
	context = {'domain':settings.DOMAIN}
	
	# Utility, method for sorting by id
	def sortById(self, arrayItem):
		return arrayItem["id"]

	# Returns User data as a dictionary/BOOTSTRAPPING  
	def RETURN_USER_DATA(self):
		result = {
					'id': self.gardener.id,
					'first_name': self.user.first_name,
					'last_name': self.user.last_name,
					'city': self.gardener.city,
					'state': self.gardener.state,
					'zipcode': self.gardener.zipcode,
					'text_blurb': self.gardener.text_blurb,
					'available': self.gardener.available,
				}
		try:
			result['profile_pic'] = self.gardener.profile_pic.url
		except ValueError:
			result['profile_pic'] = ""
		return result

	# Returns plant data as a list of dictionaries/BOOTSTRAPPING
	def RETURN_PLANT_DATA(self, img = False, _id = None):
		current_plants = []
		# if img is false, return plant data
		if not img:
			for plant in self.plants:
				current_plants.append({
					'id': plant.id,
					'information': plant.information,
					'species': plant.species,
					'quantity': plant.quantity
				})
		else:
			# if img is true
			if _id is None:
				# and no _id is specified,
				# return a list of id:imageURL-list data pairs
				for plant in self.plants:
					target_plant = {
						'id': plant.id,
						'images': []
					}
					imgs = PlantImg.objects.filter(plant = plant)
					for img in imgs:
						target_plant['images'].append({
										'imageURL': re.sub(r'\\', '/', os.path.join(settings.DOMAIN,
																'media',
																img.thumbnail.url)),
										'id': img.id})
					current_plants.append(target_plant)
			else:
				# and an _id is specified,
				# return a list of imageURLs
				target_plant = self.plants.get(id = _id)
				imgs = PlantImg.objects.filter(plant = target_plant)
				for img in imgs:
					current_plants.append({
									'imageURL':os.path.join(settings.DOMAIN,
												   			'media',
												   			img.thumbnail.url),
									'id': img.id})

		return current_plants

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(ProfilePage, self).dispatch(*args, **kwargs)

	@set_user
	# Bootstrap the data
	def get(self, request, _id = None):
		print 'test: RETURN_USER_DATA'
		print self.RETURN_USER_DATA()
		# Populate the template context with user and gardener objects and forms
		self.context['user'] = request.user.first_name
		# Populate the script above the fold with the appropriate contexts
		self.context['plant_objects'] = json.dumps(sorted(self.RETURN_PLANT_DATA(),
										 key=self.sortById))
		self.context['gardener_object'] = json.dumps(self.RETURN_USER_DATA())
		self.context['plant_img_objects'] = json.dumps(self.RETURN_PLANT_DATA(img = True))
		# Pre-render the profile picture
		if self.gardener.profile_pic is not None:
			self.context['profile_pic'] = self.gardener.profile_pic
		# Use a Django form for the profile
		self.context['profile_form'] = ProfileForm()
		# Return the rendered page
		return render(request, "profile_page.html", self.context)

# Feed Page, no-op for now 
class FeedPage(APIView):
	context = {'domain': settings.DOMAIN}

	# Limits how many instances in a query get through
	def bootstrapLimit(self, query_list, limit = None):
		if len(query_list) < limit or limit is None:
			return query_list
		return query_list[0, limit]

	# This function returns information of a certain number of Gardeners
	def RETURN_OTHER_GARDENERS(self, limit = None):
		# Creates a JSON serializable version of the first X gardeners and their plants
		other_gardeners = self.bootstrapLimit(
				filter( lambda x: not x['id'] == self.gardener.id,
						[model_to_dict(model) for model in Gardener.objects.all()]
						),
				limit
				)

		# This is a triple for-loop. Although it is ugly and not at all optimized,
		# it gets the job done
		for model in other_gardeners:
			try:
				model['profile_pic'] = model['profile_pic'].url
			except ValueError:
				model['profile_pic'] = ''
			model['plants'] = []
			for plant in Plant.objects.filter(user = model['id']):
				plant_images = PlantImg.objects.filter(plant = plant.id)
				images = []
				for img in plant_images:
					images.append({
						'id': img.id,
						'imageURL': re.sub(r'\\',
										   '/',
										   os.path.join(
										   	settings.DOMAIN,
										   	'media',
										   	img.thumbnail.url)
										   )
						})
				model['plants'].append({
					'plant': model_to_dict(plant),
					'imgs': images})
		return json.dumps(other_gardeners)

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(FeedPage, self).dispatch(*args, **kwargs)

	# @setGardenerPlantQueryset(5)
	# Bootstrapping values to show in context
	@set_user
	def get(self, request, *args, **kwargs):
		self.context['other_gardeners'] = self.RETURN_OTHER_GARDENERS(5)
		return render(request, 'feed_page.html', self.context)

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
				url_target = re.sub(r'\\', '/', os.path.join(settings.DOMAIN,
											  	'media',
											  	 self.gardener.profile_pic.url))
				response = json.dumps({'profile_pic': url_target})
				return HttpResponse(response, content_type='application/json')
		return self.create(self, request, *args, **kwargs)

	def put(self, request, *args, **kwargs):
		self.data = request.data
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
			newplantimg.save()
		response = json.dumps({
				'id': newplantimg.id,
				'imageURL': re.sub(r'\\', '/', os.path.join(settings.DOMAIN,
										 'media',
										 newplantimg.thumbnail.url))
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
		if 'id' not in self.data:
			response = self.queryset.filter(plant = kwargs['id'])
			response = json.dumps([{'id': entry.id, 'imageURL': os.path.join(settings.DOMAIN, 'media', entry.thumbnail.url) } for entry in response])
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
	@setGardenerPlantQueryset(5)
	def get(self, request, *args, **kwargs):
		if kwargs['id'] is None:
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
