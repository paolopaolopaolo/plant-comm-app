from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views.generic import View
from gardening.forms import SignUpForm

# Create your views here.

class LandingPage(View):
	context = {"signinform": SignUpForm()}

	def get(self, request):
		return render(request, "landing_page.html", self.context)

	def post(self, request):
		# Get form results
		signupform = SignUpForm(request.POST)
		# Clean up form and validate results
		if signupform.is_valid():
			# if form has valid data, redirect to the profile page
			return redirect("profile")
		message = "There was an error with the form. Try again"
		self.context["error_message"] = message
		return render(request, "landing_page.html", self.context)
		


class LoginPage(View):
	def get(self, request):
		# Test Connectivity
		return HttpResponse("<h3>GET Login Page</h3>", content_type='text/html')
	def post(self, request):
		# Test Connectivity
		return HttpResponse("<h3>POST Login Page</h3>", content_type='text/html')

class ProfilePage(View):
	def get(self, request):
		# Test Connectivity
		return HttpResponse("<h3>GET Profile Page</h3>", content_type='text/html')
	def post(self, request):
		# Test Connectivity
		return HttpResponse("<h3>POST Profile Page</h3>", content_type='text/html')

class FeedPage(View):
	def get(self, request):
		# Test Connectivity
		return HttpResponse("<h3>GET Feed Page</h3>", content_type='text/html')
	def post(self, request):
		# Test Connectivity
		return HttpResponse("<h3>POST Feed Page</h3>", content_type='text/html')