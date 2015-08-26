# A View handling server-side Chat operations
from tornado import gen, web
from gardening.tornado_handlers import TornadoHandler

# Use Django-REST framework
from rest_framework.views import APIView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.forms.models import model_to_dict

from gardening.models import *
from gardening.decorators import *
from gardening.serializers import ConvoSerializer
from django.utils.html import escape
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseServerError
import django.db

import json, copy, datetime, time, re, pdb

class ChatHandler(TornadoHandler):

	@gen.coroutine
	def _refreshConvos(self):
		get_convos = (
						Convo.objects.filter(user_a = self.gardener) |
						Convo.objects.filter(user_b = self.gardener)
					  )
		convos = []
		for convo in get_convos:
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

				gardener = User.objects.get(username=convo_to_add['user'])
				gardener = Gardener.objects.get(user = gardener)
				convo_to_add['msg_profile_pic'] = gardener.profile_pic.name
				convos.append(convo_to_add)
		self.convos = convos

	@gen.coroutine
	def _checkServerTimes(self, convos, clientTime, isNew = True):
		all_convo_times = [convo['time_initiated'] for convo in convos]
		if isNew:
			self.filtered_convos = filter(lambda x: clientTime < x, all_convo_times)
		else:
			self.filtered_convos = filter(lambda x: clientTime > x, all_convo_times)

	@gen.coroutine
	def get(self, *args, **kwargs):
		timeout = 0
		username = self.get_argument("user")
		self.gardener = Gardener.objects.get(username=username)
		request_time = self.get_argument("clientTime")
		while True:
			django.db.connection.close()
			self._refreshConvos()
			self._checkServerTimes(self.convos, request_time)
			newerServerTimes = self.filtered_convos
			# So I want client time to be checked across all conversations
			if len(newerServerTimes) > 0 or timeout > 59:
				self.write({'convos': self.convos})
				raise web.Finish()
			timeout += 0.25
			# Check every 1/4 second
			yield gen.sleep(0.25)

class ChatAPI(APIView):

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(ChatAPI, self).dispatch(*args, **kwargs)

	# Creating a new conversation!
	@set_user_and_gardener_and_convos
	def post(self, request, *args, **kwargs):
		response = HttpResponse()
		user_targ = Gardener.objects.get(id = kwargs['id'])
		filter1 = Convo.objects.filter(
											user_a = self.gardener, 
											user_b = user_targ, 
											active = False
										)
		filter2 = Convo.objects.filter(
											user_b = self.gardener,
											user_a = user_targ,
											active = False
										)
		inactive_convos = ( filter1 | filter2 )
		if len(inactive_convos) > 0:
			convo_to_restart = inactive_convos[0]
			convo_to_restart.user_a = self.gardener
			convo_to_restart.user_b = user_targ
			convo_to_restart.time_initiated = datetime.datetime.now()
			convo_to_restart.active = True
			convo_to_restart.seen_a = True
			convo_to_restart.seen_b = False
			convo_to_restart.save()
			returnContent = model_to_dict(convo_to_restart)

		else:		
			new_convo = Convo(
					user_a = self.gardener,
					user_b = user_targ,
					text = "<i class='fa fa-spinner fa-spin'></i>",
					time_initiated = datetime.datetime.now(),
					active = True,
					seen_a = True,
					seen_b = False,
				)
			new_convo.save()
			returnContent = model_to_dict(new_convo)

		response.status_code = 201
		response.reason_phrase = 'CREATED'
		response.content_type = 'application/json'
		returnContent['user'] = user_targ.username
		returnContent['time_initiated'] = new_convo.time_initiated.isoformat() 
		returnContent['msg_profile_pic'] = user_targ.profile_pic.name
		response.content = json.dumps(returnContent)
		return response

	# Work on this to clean text
	def _cleanText(self, text):
		if len(text.lstrip().rstrip()) < 1:
			return False
		return True

	def put(self, request, *args, **kwargs):
		response = HttpResponse()
		# clean the text
		seri = ConvoSerializer(data = {'text': request.data['text']})
		if seri.is_valid():
			text = seri.validated_data["text"]
			time = request.data["time_initiated"]
			convo_to_edit = Convo.objects.get(id=int(kwargs['id']))
			convo_to_edit.text = text
			convo_to_edit.time_initiated = datetime.datetime.now()
			# change SEEN status of the appropriate users
			if request.user.username == convo_to_edit.user_a.username:
				convo_to_edit.seen_b = False
				convo_to_edit.seen_a = True
			else:
				convo_to_edit.seen_a = False
				convo_to_edit.seen_b = True
			convo_to_edit.save()
			response.status_code = 202
			response.reason_phrase = "UPDATE"
			return response
		print seri.errors
		response.status_code = 200
		response.reason_phrase = "DERPAGE HAPPENED"
		return response


	@set_user_and_gardener_and_convos
	def patch(self, request, *args, **kwargs):
		convo = Convo.objects.get(id = kwargs['id'])
		if request.data['user_a'] == self.gardener.id:
			convo.seen_a = request.data['seen']
		else:
			convo.seen_b = request.data['seen']
		convo.save()
		result = {
					"convo": convo.id,
					"user_a": convo.user_a.id,
					"user_b": convo.user_b.id,
					"seen_a": convo.seen_a,
					"seen_b": convo.seen_b
		}
		response = HttpResponse(json.dumps(result), content_type='application/json')
		response.status_code = 202
		response.reason_phrase = "SEEN STATUS PATCH"
		return response

