from rest_framework.pagination import PageNumberPagination, CursorPagination
# Custom Pagination Classes

class EventsPagination(PageNumberPagination):
	page_size = 1000

class JobsPagination(CursorPagination):
	page_size = 2