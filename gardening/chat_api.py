# A View handling server-side Chat operations

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

import json, copy, datetime, time, re



class ChatAPI(APIView):

	@method_decorator(login_required)
	def dispatch(self, *args, **kwargs):
		return super(ChatAPI, self).dispatch(*args, **kwargs)

	# Brings up the right conversation,
	# A stringified light copy,
	# and the time initiated in isoformat
	def _getLastLine(self, _id, split_str="{{switch_user}}"):
		convo_to_stringify = Convo.objects.get(id=int(_id))
		stringified_convo = copy.copy(model_to_dict(convo_to_stringify))
		lastline = re.sub(r"\+", " ", convo_to_stringify.time_initiated
														.isoformat())
		return convo_to_stringify, stringified_convo, lastline

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
				convos.append(convo_to_add)
		self.convos = convos

	def _checkServerTimes(self, convos, clientTime, isNew = True):
		def __clientTimeCheck__(convo_time):
			return clientTime < convo_time
		def __clientTimeCheck2__(convo_time):
			return clientTime > convo_time

		all_convo_times = [convo["time_initiated"] for convo in convos]
		if isNew:
			filtered_convos = filter(__clientTimeCheck__, all_convo_times)
		else:
			filtered_convos = filter(__clientTimeCheck2__, all_convo_times)
		return filtered_convos


	# Listing Conversations and Retrieving text messages
	@set_user_and_gardener_and_convos
	def get(self, request, *args, **kwargs):

		# List all the conversations User is involved with
		# in the absence of a specific convo id
		try:
			clientTime = request.GET['clientTime']
			while True:
				self._refreshConvos()
				newerServerTimes = self._checkServerTimes(self.convos, clientTime)

				# So I want client time to be checked across all conversations
				if len(newerServerTimes) > 0:
					return HttpResponse(json.dumps(self.convos), content_type='application/json')

				
				# Check every 1/4 second
				time.sleep(0.25)

			return HttpResponse(json.dumps(self.convos), content_type='application/json')
		
		except Exception, e:
			return HttpResponseServerError(json.dumps({'Error' : str(e)}), content_type='application/json')

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

