from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils.decorators import method_decorator
from gardening.models import *


# Simple Decorators
def login_as_user(**decorator_kwargs):
	def wrapper(method):
		def wrapper_function(*args, **kwargs):
			self = args[0]
			self.client.login(**decorator_kwargs)
			method(self)
			self.client.logout()
		return wrapper_function
	return wrapper

# Base Test (Inherit all tests from here)
class SiteTest(TestCase):
	fixtures = ['seed.json', ]
	client = None

	def setUp(self): 
		self.client = Client()

# Testing that LogIns/SignUps work
class CredentialsTesting(SiteTest):

	## Tests signing up ##

	# Sign up new user
	def test_0000_signup(self):
		resp = self.client.post('/uauth/?access_type=signup',{
								'first_name': 'Andy',
								'last_name': 'Brickman',
								'username': 'a.brick',
								'email': 'a.brick@gmail.com',
								'password': 'password',
								'confirm_password': 'password',
								}, follow=True)
		self.assertRedirects(resp, '/profile/')
		try:
			user = User.objects.get(username = 'a.brick')
			gardener = Gardener.objects.get(user = user)
		except Exception, e:
			raise AssertionError('User/Gardener not saved')

		self.assertEqual(user.email, 'a.brick@gmail.com')
		self.assertEqual(user.first_name, gardener.first_name)
		self.assertEqual(user.last_name, gardener.last_name)
		self.assertEqual(user.username, gardener.username)

		self.client.logout()

	# Sign up user with taken username
	def test_0001_username_taken(self):
		
		with self.assertRaises(IntegrityError):
			resp = self.client.post('/uauth/?access_type=signup',{
									'first_name': 'Andy',
									'last_name': 'Brickman',
									'username': 'a.bedelia',
									'email': 'a.brick@gmail.com',
									'password': 'password',
									'confirm_password': 'password',
									}, follow=True)

	## Tests logging in ##
			
	# Test email login
	def test_0002_email_login(self):
		user = User.objects.get(email='asdasd@gmail.com')
		resp = self.client.post('/uauth/?access_type=login',{
								'uname_email': 'asdasd@gmail.com',
								'password': 'abcd1234',
								}, follow=True)
		self.assertRedirects(resp, '/feed/')
		self.client.logout()

	# Test username login
	def test_0003_username_login(self):
		user = User.objects.get(email='asdasd@gmail.com')
		resp = self.client.post('/uauth/?access_type=login',{
								'uname_email': 'a.bedelia',
								'password': 'abcd1234',
								}, follow=True)
		self.assertRedirects(resp, '/feed/')
		self.client.logout()

# Testing that pages render
class RenderTesting(SiteTest):

	@login_as_user(username="a.bedelia", password="abcd1234")
	def test_000_profile(self):
		response = self.client.get('/profile/')
		self.assertEquals(response.status_code, 200)

	@login_as_user(username="a.bedelia", password="abcd1234")
	def test_001_feed(self):
		response = self.client.get('/feed/')
		self.assertEquals(response.status_code, 200)

	@login_as_user(username="gherman", password="abcd1234")
	def test_002_following(self):
		response = self.client.get('/follow/')
		self.assertEquals(response.status_code, 200)



