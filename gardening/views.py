from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.http import HttpResponse
from django.views.generic import View, TemplateView
from gardening.forms import SignUpForm, LogInForm
from gardening.models import Gardener
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User


# Create your views here.
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
							email = form_data.get('email'),
							username = form_data.get('username'),
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

# Profile Page, edit the profile!
class ProfilePage(View):
	context = {}

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(ProfilePage, self).dispatch(*args, **kwargs)

	def get(self, request):
		self.context['user'] = request.user
		
		return render(request, "profile_page.html", self.context)
		# Test Connectivity
		# return HttpResponse("<h3>GET Profile Page</h3>", content_type='text/html')
		
	def post(self, request):
		# Test Connectivity
		return HttpResponse("<h3>POST Profile Page</h3>", content_type='text/html')

class FeedPage(View):

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(FeedPage, self).dispatch(*args, **kwargs)

	def get(self, request):
		# Test Connectivity
		return HttpResponse("<h3>GET Feed Page</h3>", content_type='text/html')

	def post(self, request):
		# Test Connectivity
		return HttpResponse("<h3>POST Feed Page</h3>", content_type='text/html')