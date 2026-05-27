import time
import uuid

import structlog

logger = structlog.get_logger("http")


class RequestIDMiddleware:
    HEADER = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get(self.HEADER) or uuid.uuid4().hex
        request.request_id = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.path,
        )

        started = time.perf_counter()
        try:
            response = self.get_response(request)
        except Exception:
            logger.exception("request_failed")
            raise
        duration_ms = int((time.perf_counter() - started) * 1000)

        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            structlog.contextvars.bind_contextvars(user_id=str(user.id))

        logger.info(
            "request",
            status=response.status_code,
            duration_ms=duration_ms,
        )
        response["X-Request-ID"] = request_id
        return response
