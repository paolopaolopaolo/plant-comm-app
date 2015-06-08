from django import template
from django.conf import settings
import re, os

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

def replace_default_plant_info(value, param):
	if value == DefaultPlantInfo[param]:
		if param == "quantity":
			return "None yet"
		elif param == "species":
			return "Unknown"
		elif param == "information":
			return "".join([
								"This is a new plant! ",
								"The gardener is in the ",
								"process of updating this ",
								"information. Check back in ",
								"a little!"
							])

def get_length(value):
	return len(value)

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

def remove_colon(value):
	return value.replace(':', '')

def check_if_exist(value):
	if value is None:
		return ""
	return value


register.filter('removeColon', remove_colon)
register.filter('checkIfExist', check_if_exist)
register.filter('normalizeMediaPic', normalize_media_pic)
register.filter('getLength', get_length)
register.filter('replaceDefaultPlant', replace_default_plant_info)