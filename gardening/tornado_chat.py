from gardening.tornado_handlers import TornadoHandler

class HelloWorldHandler(TornadoHandler):

    def get(self):
        self.write("Hello World!")