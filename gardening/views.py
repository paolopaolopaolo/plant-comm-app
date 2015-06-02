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

from rest_framework import mixins
from rest_framework import generics
from PIL import Image

from gardening.decorators import *

import json, os, StringIO, re

## Function based views ##

# Logs user out and returns
# to landing page
def log_out(request):
	gardener = Gardener.objects.get(user = request.user)
	gardener.online = False
	gardener.save()
	logout(request)
	return redirect('landing')

# Landing page (for signing up/logging in)
class LandingPage(View):
	context = {
				"signinform": SignUpForm(),
				"loginform": LogInForm(),
				"compress_enabled": settings.COMPRESS_ENABLED
			  }

	# Just pull up the webpage
	def get(self, request):
		try:
			if request.user.is_authenticated():
				return redirect("feed")
			else:
				return render(request, "landing_page.html", self.context)
		except Exception, e:
			return HttpResponseServerError(str(e), content_type='text/plain')

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
					gardener = Gardener.objects.get(
									user = User.objects.get(
												username = user.username
												)
									)
					gardener.online = True
					gardener.save()

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
	context = {
				'domain': settings.DOMAIN,
				'compress_enabled': settings.COMPRESS_ENABLED
			  }
	
	# Utility, method for sorting by id
	def sortById(self, arrayItem):
		return arrayItem["id"]

	# Returns User data as a dictionary/BOOTSTRAPPING  
	def RETURN_USER_DATA(self):
		result = {
					'id': self.gardener.id,
					'username': self.user.username,
					'first_name': self.user.first_name,
					'last_name': self.user.last_name,
					'city': self.gardener.city,
					'state': self.gardener.state,
					'zipcode': self.gardener.zipcode,
					'text_blurb': self.gardener.text_blurb,
					'available': self.gardener.available,
				}
		if self.gardener.profile_pic:
			try:
				result['profile_pic'] = self.gardener.profile_pic.url
			except SuspiciousOperation:
				result['profile_pic'] = self.gardener.profile_pic.name
		else:
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
										'imageURL': img.thumbnail.url,
										'id': img.id})

					current_plants.append(target_plant)
			else:
				# and an _id is specified,
				# return a list of imageURLs
				target_plant = self.plants.get(id = _id)
				imgs = PlantImg.objects.filter(plant = target_plant)
				for img in imgs:
					current_plants.append({
									'imageURL':img.thumbnail.url,
									'id': img.id
									})

		return current_plants

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(ProfilePage, self).dispatch(*args, **kwargs)

	@set_user
	# Bootstrap the data
	def get(self, request, _id = None):
		try:
			# Populate the template context with user and gardener objects and forms
			self.context['user'] = request.user.first_name
			# Populate the script above the fold with the appropriate contexts
			self.context['plant_objects'] = json.dumps(sorted(self.RETURN_PLANT_DATA(),
											 key=self.sortById))
			try:
				self.context['gardener_object'] = json.dumps(self.RETURN_USER_DATA())
			except Exception, e:
				return HttpResponseServerError(str(e.message), content_type='text/plain')
			self.context['plant_img_objects'] = json.dumps(self.RETURN_PLANT_DATA(img = True))
			# Pre-render the profile picture
			if self.gardener.profile_pic:
				self.context['profile_pic'] = self.gardener.profile_pic.name
			# Use a Django form for the profile
			self.context['profile_form'] = ProfileForm()
			# Return the rendered page
			return render(request, "profile_page.html", self.context)
		except Exception, e:
			return HttpResponseServerError(str(e), content_type='text/plain')

# Feed Page: View gardeners/gardens in the area
class FeedPage(APIView):
	if settings.DEBUG:
		domain = settings.DOMAIN
	else:
		domain = "https://plantappstorage.s3.amazonaws.com"

	context = {
		'domain': settings.DOMAIN,
		'compress_enabled': settings.COMPRESS_ENABLED
	}

	# Limits how many instances in a query get through
	def bootstrapLimit(self, query_list, limit = None):
		if len(query_list) < limit or limit is None:
			return query_list
		return query_list[0: limit]

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
		# it gets the job done for now
		for model in other_gardeners:
			# Get a user obj to obtain some user attributes
			user_obj = User.objects.get(id = model['user'])
			# Set username in model
			model['username'] = user_obj.username
			# Reset profile_pic object to just the string/name if possible, 
			# If no string/name available, set to empty string
			try:
				model['profile_pic'] = model['profile_pic'].name
			except ValueError:
				model['profile_pic'] = ''
			# Create a plants attribute (empty list)
			model['plants'] = []
			# For each plant in the filter, 
			for plant in Plant.objects.filter(user = model['id']):
				# Get all the images of that plant
				plant_images = PlantImg.objects.filter(plant = plant.id)
				images = []
				# For each image in plantimg, add to images array that plant image
				for img in plant_images:
					img_thumbnail = None
					try:
						img_thumbnail = img.thumbnail.url
					except Exception:
						print "Original image url not used (Issue with S3?)!"
						img_thumbnail = "/".join([
											"https://plantappstorage.s3.amazonaws.com/media",
						                	img.thumbnail.name
						                ])
					images.append({
						'id': img.id,
						'imageURL': img_thumbnail})


				# Add to 'plants' attribute the plant attributes 
				# and the list of images
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
	@set_user_and_gardener_and_convos
	def get(self, request, *args, **kwargs):
		try:
			self.context['other_gardeners'] = self.RETURN_OTHER_GARDENERS(2)
			self.context['convos'] = json.dumps(self.convos)
			self.context['user'] = request.user
			return render(request, 'feed_page.html', self.context)
		except Exception, e:
			print str(e)
			return HttpResponse(str(e))

