from django.test import TestCase, Client, RequestFactory
from django.contrib.auth.models import User, AnonymousUser
from django.db import IntegrityError
from django.utils.decorators import method_decorator
from gardening.models import *
from gardening.rest_apis import *
from gardening.chat_api import *
from gardening.views import *

from random import choice

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

def label_test(**decorator_kwargs):
	def wrapper(method):
		def wrapper_function(*args, **kwargs):
			print "\t\t".join([decorator_kwargs['test'], ""]),
			method(*args, **kwargs)
			print "OK"
		return wrapper_function
	return wrapper

# Base Test (Inherit all tests from here)
class SiteTest(TestCase):
	test_name = ''
	fixtures = ['seed.json', ]
	client = None
	first_names = [	'Andrew',
					'Ava',
					'Barbara',
					'Brady',
					'Chuck',
					'Daniel',
					'Ernie',
					'Elizabeth'
				  ]
	last_names = [	'Carter',
					'Daniels',
					'Englebert',
					'Fiorina',
					'Goldman'
				]
	
	letters = 'abcdefghijklmnopqrstuvwkyz'
	
	numbers = '01234567890'


	def _randomUserLabels(self):
		username = choice(self.letters)
		for i in range(8):
			username = "".join([username, choice(self.letters)])
		for j in range(4):
			username = "".join([username, choice(self.numbers)])
		email = "@".join([username, "gmail.com"])
		return username, email
		
	def _populateWithNewUsers(self, times):
		for i in range(times):
			username, email = self._randomUserLabels()
			self.client.post('/uauth/?access_type=signup',{
									'first_name': choice(self.first_names),
									'last_name': choice(self.last_names),
									'username': username,
									'email': email,
									'password': 'password',
									'confirm_password': 'password',
									}, follow=True)

	def setUp(self):
		print '%s::\t\t' % (self.test_name), 
		self.factory = RequestFactory()
		self.client = Client()

# Testing that LogIns/SignUps work
class CredentialsTesting(SiteTest):
	test_name = 'Credentials'
	## Tests signing up ##

	# Sign up new user
	@label_test(test="Sign Up Test:")
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
	@label_test(test="Taken username test:")
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
	@label_test(test="Email login test:")
	def test_0002_email_login(self):
		user = User.objects.get(email='asdasd@gmail.com')
		resp = self.client.post('/uauth/?access_type=login',{
								'uname_email': 'asdasd@gmail.com',
								'password': 'abcd1234',
								}, follow=True)
		self.assertRedirects(resp, '/feed/')
		self.client.logout()

	# Test username login
	@label_test(test="Username login test:")
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
	test_name = "Rendering"

	def setUp(self):
		super(RenderTesting, self).setUp()
		self._populateWithNewUsers(10)

	@label_test(test="Profile Render test:")
	@login_as_user(username="a.bedelia", password="abcd1234")
	def test_000_profile(self):
		response = self.client.get('/profile/')
		self.assertEquals(response.status_code, 200)

	@label_test(test="Feed Render test:")
	@login_as_user(username="t.testerman", password="abcd1234")
	def test_001_feed(self):
		response = self.client.get('/feed/')
		self.assertEquals(response.status_code, 200)

	@label_test(test="Follow Render test:")
	@login_as_user(username="gherman", password="abcd1234")
	def test_002_following(self):
		response = self.client.get('/follow/')
		self.assertEquals(response.status_code, 200)

	@label_test(test="Search Page test:")
	@login_as_user(username="a.bedelia", password="abcd1234")
	def test_003_search(self):
		response = self.client.get('/search/', {'query': 'a'})
		self.assertEquals(response.status_code, 200)

	@label_test(test="Search Page test (not logged in:)")
	def test_004_search(self):
		self.client.logout()
		response = self.client.get('/search/', {'query': 'a.bedelia'})
		self.assertEquals(response.status_code, 200)

# Testing that certain interactions work
class InteractionsTesting(SiteTest):
	test_name = "Interactions"

	def setUp(self):
		super(InteractionsTesting, self).setUp()
		self._populateWithNewUsers(50)

	# Test for user favoriting and unfavoritingother users
	@label_test(test="Favoriting + Unfavoriting test:")
	def test_000_follow_put_test(self):
		past_users = []
		rand_user1 = choice(User.objects.all())
		gardener = Gardener.objects.get(user = rand_user1)

		def other_in_fav(other_user):
			gardener2 = Gardener.objects.get(user = other_user)
			request = self.factory.put("".join([
												"/follow/",
												str(gardener2.id), 
												"/"
											]))
			request.user = rand_user1
			view = Following.as_view()
			response = view(request, id = gardener2.id)
			favorites = gardener.favorites.get_queryset()
			return gardener2 in favorites

		# Follow 10 people and put them in past_users
		for i in range(0, 10):
			user_pool = User.objects.exclude(username = rand_user1.username)
			user_pool = filter(lambda x: not (x in past_users), user_pool)
			rand_user2 = choice(user_pool)
			is_in_favs = other_in_fav(rand_user2)
			past_users.append(rand_user2)
			self.assertTrue(is_in_favs)

		# Unfollow all the people in past_users
		for rand_user2 in past_users:
			is_in_favs = other_in_fav(rand_user2)
			self.assertTrue(not is_in_favs)
