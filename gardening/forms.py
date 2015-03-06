from django import forms
from django.contrib.auth.models import User

class SignUpForm(forms.Form):

	def clean(self):
		# obtain cleaned data 
		cleaned_data = super(SignUpForm, self).clean()
		try:
			password = cleaned_data["password"]
			confirm_password = cleaned_data["confirm_password"]
		except KeyError:
			raise forms.ValidationError("No passwords given")
		if password and confirm_password:
			if not(password == confirm_password):
				raise forms.ValidationError("Passwords do not match")

	first_name = forms.CharField(max_length=100,
								 label="First name:",
								 required=True)

	last_name = forms.CharField(max_length=100,
								label="Last name:")

	user_name = forms.CharField(max_length=100,
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