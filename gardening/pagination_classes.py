from rest_framework.pagination import PageNumberPagination
# Custom Pagination Classes

class EventsPagination(PageNumberPagination):
	page_size = 3