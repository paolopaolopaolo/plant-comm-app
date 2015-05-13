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

	def _checkServerTimes(self, convos, clientTime):
		def __clientTimeCheck__(convo_time):
			return clientTime < convo_time
		all_convo_times = [convo["time_initiated"] for convo in convos]
		filtered_convos = filter(__clientTimeCheck__, all_convo_times)
		return filtered_convos

	# Listing Conversations and Retrieving text messages
	@set_user_and_gardener_and_convos
	def get(self, request, *args, **kwargs):
		# List all the conversations User is involved with
		# in the absence of a specific convo id
		if kwargs['id'] is None:
			clientTime = request.GET['clientTime']
			while True:
				self._refreshConvos()
				newerServerTimes = self._checkServerTimes(self.convos, clientTime)
				# So I want client time to be checked across all conversations
				if len(newerServerTimes) > 0:
					return HttpResponse(json.dumps(self.convos), content_type='application/json')
				time.sleep(0.25)
		
		# while True:
		# 	# Get an updated set of params from the DB
		# 	convo_to_stringify, stringified_convo, lastline = self._getLastLine(kwargs['id'])
		# 	# Strip the incoming timestamp (requestG is the client's latest timestamp)
		# 	requestG = request.GET['currentTime'].lstrip().rstrip()
		# 	# if not requestG == lastline:
		# 	# 	print "Discrepancy::\nClient: ",
		# 	# 	print requestG,
		# 	# 	print "\t Server: ",
		# 	# 	print lastline
		# 	# Compare the client's timestamp with the server's last timestamp
		# 	if requestG < lastline:
		# 		# Find out who the user is and their 'seen' attribute for this convo
		# 		if not(convo_to_stringify.user_a.username == request.user.username):
		# 			stringified_convo['user'] = convo_to_stringify.user_a.username
		# 			stringified_convo['seen'] = stringified_convo['seen_b']
		# 		else:
		# 			stringified_convo['user'] = convo_to_stringify.user_b.username
		# 			stringified_convo['seen'] = stringified_convo['seen_a']

		# 		# Send the updated time back to the client
		# 		stringified_convo['time_initiated'] = lastline
		# 		# Send the updated text back to the client
		# 		stringified_convo['text'] = convo_to_stringify.text
		# 		return HttpResponse(json.dumps(stringified_convo), content_type='application/json')
		# 	# Check every 1/4 second
		# 	time.sleep(0.25)

	# Creating a new conversation!
	@set_user_and_gardener_and_convos
	def post(self, request, *args, **kwargs):
		response = HttpResponse()
		user_targ = Gardener.objects.get(id = kwargs['id'])
		new_convo = Convo(
				user_a = self.gardener,
				user_b = user_targ,
				text = " ",
				time_initiated = datetime.datetime.now(),
				active = True,
				seen_a = True,
				seen_b = False,
			)
		new_convo.save()
		response.status_code = 201
		response.reason_phrase = 'CREATED'
		response.content_type = 'application/json'
		returnContent = model_to_dict(new_convo)
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
		response.status_code = 204
		response.reason_phrase = "NO CONTENT"
		return response

