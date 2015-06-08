from django import template
import re, os

register = template.Library()

def get_length(value):
	return len(value)

def normalize_media_pic(value, media_url, domain = None):
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