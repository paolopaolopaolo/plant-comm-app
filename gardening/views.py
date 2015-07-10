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
	# if hasattr(request, "user"):
	# 	print "Logout"
	# 	print request.user
	# 	gardener = Gardener.objects.get(user = User.objects.get(username=request.user))
	# 	gardener.online = False
	# 	gardener.save()
	logout(request)
	return redirect('landing')


# Class common to all views
class GreenThumbPage(View):
	context = {
		"domain": settings.DOMAIN,
		"zipcode_api_url": json.dumps(settings.ZIPCODE_API_URL),
		"media_url": settings.MEDIA_URL,
		"compress_enabled": settings.COMPRESS_ENABLED,
		"signinform": SignUpForm(),
		"loginform": LogInForm(),
		"profileform": ProfileForm(),
		"showsFooter": True,
	}
	# Utility, method for sorting by id
	def sortById(self, arrayItem):
		return arrayItem["id"]

	def RETURN_FOLLOWER_DATA(self):
		result = self.gardener.favorites.get_queryset()
		result = [{"id": gardener.id, "favorite": True} for gardener in result]
		return result

	# Returns User data as a dictionary/BOOTSTRAPPING  
	def RETURN_USER_DATA(self, _id = None, plants=False):
		if _id is None:
			gardener = self.gardener
			user = self.user
		else:
			user = User.objects.get(username = _id)
			gardener = Gardener.objects.get(user = user)

		result = {
					'id': gardener.id,
					'username': user.username,
					'online': gardener.online,
					'first_name': user.first_name,
					'last_name': user.last_name,
					'city': gardener.city,
					'state': gardener.state,
					'zipcode': gardener.zipcode,
					'text_blurb': gardener.text_blurb,
					'available': gardener.available,
				}
		if gardener.profile_pic:
			try:
				result['profile_pic'] = gardener.profile_pic.url
			except SuspiciousOperation:
				result['profile_pic'] = gardener.profile_pic.name
		else:
			result['profile_pic'] = ""

		if plants:
			result["plants"] = self.RETURN_PLANT_DATA(img=True, _id = result["username"])
		return result

	# Returns plant data as a list of dictionaries/BOOTSTRAPPING
	def RETURN_PLANT_DATA(self, img = False, _id = None):
		domain_aws = settings.MEDIA_URL
		current_plants = []
		if _id is None:
			plants = self.plants
		else:
			gardener = Gardener.objects.get(user = User.objects.get(username=_id))
			plants = Plant.objects.filter(user = gardener)

		current_plants = []

		# if img is false, return plant data
		for plant in plants:
			plant_obj = {
				'id': plant.id,
				'information': plant.information,
				'species': plant.species,
				'quantity': plant.quantity
			}
			# if img is true, return plant_img data
			if img:
				plant_obj['images'] = []
				imgs = PlantImg.objects.filter(plant = plant)
				for img in imgs:
					try:
						url_target = img.thumbnail.url
					except Exception:
						url_target = img.thumbnail.name
					plant_obj['images'].append({
									'imageURL': url_target,
									'id': img.id})
			current_plants.append(plant_obj)

		return current_plants

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
						img_thumbnail = img.thumbnail.name
					images.append({
						'id': img.id,
						'imageURL': img_thumbnail})


				# Add to 'plants' attribute the plant attributes 
				# and the list of images
				model['plants'].append({
					'plant': model_to_dict(plant),
					'imgs': images})
		return json.dumps(other_gardeners)

# Landing page (gateway before signing up/logging in)
class LandingPage(GreenThumbPage):

	# Just pull up the webpage
	def get(self, request):
		content_items = {}
		for content_item in Content.objects.filter(page='LA'):
			content_items[content_item.descriptor] = content_item.content

		self.context["content"] = content_items
		self.context["showsFooter"] = True
		self.context["isAuthenticated"] = request.user.is_authenticated()
		self.context["useBackbone"] = False
		try:
			if request.user.is_authenticated():
				return redirect("feed")
			else:
				return render(request, "gardening/landing_page/landing_page.html", self.context)
		except Exception, e:
			return HttpResponseServerError(str(e), content_type='text/plain')

# SignUp/Login Pages
class UserAuthenticationPage(GreenThumbPage):
	def get(self, request):
		self.context["user"] = request.user.username
		self.context["isAuthenticated"] = request.user.is_authenticated()
		self.context["showsFooter"] = False
		if request.user.is_authenticated():
			return redirect("feed")
		else:
			if request.GET['access_type'] == 'login':
				self.context["showSignUp"] = False
				self.context["showLogIn"] = True
			elif request.GET['access_type'] =='signup':
				self.context["showSignUp"] = True
				self.context["showLogIn"] = False
			return render(request, "gardening/uauth_page/uauth.html", self.context)

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
				garden_user = Gardener(user = user, username = user.username)
				garden_user.save()
				# Authenticate and login this new user
				auth_user = authenticate(
								username = form_data.get('username'),
								password = form_data.get('password')
							)
				login(request, auth_user)
				if "next" in request.GET:
					return redirect(request.GET["next"])

				# redirect to profile with user
				return redirect("profile")
			# Feed error message to the view context
			message = signupform.error_message
			self.context["error_message"] = message
			self.context["showSignUp"] = True
			self.context["showLogIn"] = False
			return render(request, "gardening/uauth_page/uauth.html", self.context)
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
					if "next" in request.GET:
						return redirect(request.GET["next"])
					return redirect("feed")
				
				message = "Invalid Email/Password combination Try again"
				self.context["error_message"] = message
				self.context["showSignUp"] = False
				self.context["showLogIn"] = True
				return render(request, "gardening/uauth_page/uauth.html", self.context)
			message = "Please use a valid email."
			self.context["error_message"] = message
			self.context["showSignUp"] = False
			self.context["showLogIn"] = True
			return render(request, "gardening/uauth_page/uauth.html", self.context)
		
# Profile Page: Edit/View the profile
class ProfilePage(GreenThumbPage, APIView):

	@set_user_and_gardener_and_convos
	# Bootstrap the data
	def get(self, request, *args, **kwargs):
		if request.user.is_authenticated():
			self.context['followers'] = json.dumps(self.RETURN_FOLLOWER_DATA())
			self.context["header_profile_pic"] = self.gardener.profile_pic
			self.context["convos"] = json.dumps(self.convos)
		self.context["showsFooter"] = True
		self.context["isAuthenticated"] = request.user.is_authenticated()

		if kwargs["user"] is None or "user" not in kwargs:
			__user = None
			editable = True
		else:
			__user = kwargs["user"]
			editable = False

		self.context["useBackbone"] = True

		# Populate Profile Page with Non-JSON-Encoded user and plant data
		self.context['gardener'] = self.RETURN_USER_DATA(_id = __user, plants=True)
		self.context['plants'] = sorted(self.RETURN_PLANT_DATA(_id = __user, img = True), key=self.sortById, reverse=True)		
		self.context['is_editable'] = editable


		# Populate the template context with user and gardener objects and forms
		self.context['user'] = request.user
		
		# Populate the script above the fold with the appropriate contexts
		self.context['plant_objects'] = json.dumps(self.context['plants'])

		self.context['gardener_object'] = json.dumps(self.context['gardener'])

		self.context['isEditable'] = json.dumps(self.context['is_editable'])

		self.context['profileform'] = ProfileForm(initial=self.context['gardener'])

		
		# Return the rendered page
		return render(request, "gardening/profile_page/profile_page.html", self.context)

# Feed Page: View gardeners/gardens in the area
class FeedPage(GreenThumbPage, APIView):

	# Enforce login-only 
	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(FeedPage, self).dispatch(*args, **kwargs)

	@set_user_and_gardener_and_convos
	def get(self, request, *args, **kwargs):
		self.context['followers'] = json.dumps(self.RETURN_FOLLOWER_DATA())
		self.context['header_profile_pic'] = self.gardener.profile_pic
		self.context['other_gardeners'] = self.RETURN_OTHER_GARDENERS(2)
		self.context['convos'] = json.dumps(self.convos)
		self.context['user'] = request.user
		self.context['showsFooter'] = True
		self.context['isAuthenticated'] = request.user.is_authenticated()
		return render(request, 'gardening/feed_page/feed_page.html', self.context)

# Simple Backend API that returns if given 
# id is in a user's favorites or not. Can also add
# ids to user's favorites list
class Following(GreenThumbPage):

	@set_user
	@method_decorator(login_required)
	def put(self, request,*args, **kwargs):
		other_user = Gardener.objects.get(id = kwargs["id"])
		result = other_user in self.gardener.favorites.get_queryset()
		if result:
			self.gardener.favorites.remove(other_user)
		else:
			self.gardener.favorites.add(other_user)

		return HttpResponse(json.dumps({"id": kwargs["id"] ,"favorite": not result}), content_type="application/json")

		