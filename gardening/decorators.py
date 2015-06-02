from rest_framework import mixins
from gardening.models import *
from django.contrib.auth.models import User
from django.utils.html import escape
from django.http import HttpResponse, HttpResponseServerError

import re
## Decorators ##

# Sets user/gardener/plant objects 
# for ProfilePage GET method 
def set_user(method):
	try:
		def setting_user(*args, **kwargs):
			self = args[0]
			request = args[1]
			self.user = User.objects.get(username = request.user)
			self.gardener = Gardener.objects.get(user = self.user)
			self.plants = Plant.objects.filter(user = self.gardener)
			return method(*args, **kwargs)
		return setting_user
	except Exception, e:
		return HttpResponse(str(e), content_type='text/plain')

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
def setGardenerPlantQueryset(method, limit = None, preFilter = None):
	try:
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
				model.username = model.user.username
				model.plants = []
				for plant in Plant.objects.filter(user = model.id):
					result_obj = {}
					result_obj['plant'] = plant
					result_obj['imgs'] = []
					plantimgs = PlantImg.objects.filter(plant = plant.id)
					for plantimg in plantimgs:
						result_obj['imgs'].append({ 
									'id': plantimg.id,
									'imageURL': plantimg.thumbnail.url
									})
					model.plants.append(result_obj)

			# self.data = self.queryset
			return method(self, request, *args, **kwargs)
		return wrapper1
	except Exception, e:
		return HttpResponse(str(e), content_type='application/json')

def set_user_and_gardener_and_convos(mthod):
	def wrapper(*args, **kwargs):
		self = args[0]
		request = args[1]

		self.user = User.objects.get(username = request.user)
		self.gardener = Gardener.objects.get(user = self.user)
		self.convos = (
						Convo.objects.filter(user_a = self.gardener) |
						Convo.objects.filter(user_b = self.gardener)
					  )
		convos = []
		for convo in self.convos:
			if convo.active:
				convo_to_add = {
					"id": convo.id,
					"user_a": convo.user_a.id,
					"user_b": convo.user_b.id,
					"text": re.sub(r"</script>", "<\/script>", convo.text),
					"time_initiated": convo.time_initiated.isoformat(),
				}
				if convo_to_add['user_a'] == self.gardener.id:
					convo_to_add['user'] = convo.user_b.username
					convo_to_add['seen'] = convo.seen_a 
				elif convo_to_add['user_b'] == self.gardener.id:
					convo_to_add['user'] = convo.user_a.username
					convo_to_add['seen'] = convo.seen_b
				convos.append(convo_to_add)
		self.convos = convos
		return mthod(self, request, *args, **kwargs)
	return wrapper
