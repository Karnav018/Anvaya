from rest_framework.views import exception_handler


def drf_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and isinstance(response.data, dict) and "detail" not in response.data:
        response.data = {"detail": response.data}
    return response
