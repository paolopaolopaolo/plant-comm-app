from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class SignUpForm(forms.Form):

	error_message = ""

	# clean() overrides to check passwords off each other
	# as well as enforce uniqueness in email addresses
	def clean(self):
		# obtain cleaned data 
		cleaned_data = super(SignUpForm, self).clean()

		# Check passwords off each other
		try:
			password = cleaned_data["password"]
			confirm_password = cleaned_data["confirm_password"]
		except KeyError:
			self.error_message = "::".join([
				self.error_message,
				"No passwords given"
			])
			raise forms.ValidationError("No passwords given")

		if password and confirm_password:
			if not(password == confirm_password):
				self.error_message = "::".join([
					self.error_message,
					"Passwords do not match"
				])
				raise forms.ValidationError("Passwords do not match")

		# Enforce Email uniqueness
		email = cleaned_data["email"]
		users_with_this_email = User.objects.filter(email = email)
		if len(users_with_this_email) > 0:
			self.error_message = "::".join([
				self.error_message,
				"More than one user with this email"
			])
			raise forms.ValidationError("More than one user with this email")


	first_name = forms.CharField(max_length=100,
								 label="First name:",
								 required=True)

	last_name = forms.CharField(max_length=100,
								label="Last name:")

	username = forms.CharField(max_length=100,
								label="Username:",
								required=True)

	email = forms.EmailField(label="Email:", required=True)

	password = forms.CharField(label="Password:",
							   min_length=8,
							   widget=forms.widgets.PasswordInput,
							   required=True)

	confirm_password = forms.CharField(
						label="Confirm Password:",
						min_length=8,
						widget=forms.widgets.PasswordInput,
						required=True)

class LogInForm(forms.Form):

	login_is_email = False
	email = None

	def clean(self):
		cleaned_data = super(LogInForm, self).clean()
		try:
			validate_email(cleaned_data.get('uname_email'))
			self.login_is_email = True
			self.email = cleaned_data.get('uname_email')
		except ValidationError:
			self.login_is_email = False


	uname_email = forms.CharField(
							label='Email or Username:',
							required=True)
	password = forms.CharField(
						label="Password:",
						widget=forms.widgets.PasswordInput,
						required=True)

	def auth_user(self):
		username = None
		print "login_is_email: %s" % self.login_is_email
		if self.login_is_email:
			user = User.objects.get(email = self.email)
			username = user.username
		else:
			username = self.cleaned_data["uname_email"]
		return authenticate(
				username = username,
				password = self.cleaned_data["password"]
			)

class ProfileForm(forms.Form):
	pass
