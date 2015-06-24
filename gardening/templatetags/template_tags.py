from django import template
from django.conf import settings
import re, os
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

register = template.Library()

DefaultPlantInfo = {
	"quantity": 0,
	"species": "Use the name most familiar to you.",
	"information": "".join([
								"You've added a new plant.",
								" Use this section to tell ",
								"people how they should care",
								" for your plants (i.e. inst",
								"ructions for watering, pruni",
								"ng, fertilizer, etc.)."
							])
}

@register.filter(name='replaceDefaultPlant', needs_autoescape=True)
def replace_default_plant_info(value, param, autoescape=True):

	if param not in DefaultPlantInfo:
		if value == DefaultPlantInfo["information"]:
			if param == "":
				param = "This user"
			if autoescape:
				esc = conditional_escape
			else:
				esc = lambda x: x

			result = "".join([
									"This is a new plant! <span class='handler-first_name'>",
									esc(param), "</span> is in the ",
									"process of updating this ",
									"information. Check back in ",
									"a little!"
								])
			return mark_safe(result)

	else:
		if value == DefaultPlantInfo[param]:
			if param == "quantity":
				return "None yet"
			elif param == "species":
				return "Unknown"


	return value
			

@register.filter(name='getLength')
def get_length(value):
	return len(value)

@register.filter(name='normalizeMediaPic')
def normalize_media_pic(value, media_url = None, domain = None):
	if media_url is None:
		media_url = settings.MEDIA_URL

	if type(value) is unicode or type(value) is str:
		if re.search(r"http", value) is not None:
			return value
		elif value == "":
			return "https://plantappstorage.s3.amazonaws.com/static/img/user_blank_image.png"
		return os.path.join(media_url, value)
	else:
		try:
			return value.url
		except Exception:
			if re.search(r"http", value.name) is not None:
				return value.name
			elif value == "":
				return "https://plantappstorage.s3.amazonaws.com/static/img/user_blank_image.png"
			return os.path.join(media_url, value.name)
		return "URL IS NOT A STRING"

@register.filter(name='removeColon')
def remove_colon(value):
	return value.replace(':', '')

@register.filter(name='checkIfExist')
def check_if_exist(value):
	if value is None:
		return ""
	return value

