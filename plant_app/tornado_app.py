import django.core.handlers.wsgi  
from django.conf import settings  
from tornado import web, wsgi, options, httpserver, ioloop
import sys, os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plant_app.settings")
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

django.setup()

from gardening.tornado_chat import HelloWorldHandler
from gardening.chat_api import ChatHandler
from gardening.models import *

def main(port):  
  options.parse_command_line()
  tornado_app = web.Application([
    web.url(r'/helloworld', HelloWorldHandler),
    web.url(r'/convo(/[0-9]+){0,1}', ChatHandler),
  ])
  server = httpserver.HTTPServer(tornado_app)
  server.listen(port)
  ioloop.IOLoop.instance().start()

if __name__ == '__main__':
  print sys.argv
  if len(sys.argv) > 1:  
  	main(sys.argv[1])
