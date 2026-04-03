"""
Rate limiting middleware using slowapi.
Prevents API abuse and DDoS attacks.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


# Initialize limiter with remote address as key
limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])


def setup_rate_limiting(app):
    """
    Add rate limiting to FastAPI app.
    
    Default: 1000 requests per minute per IP
    Auth endpoints: 100 requests per minute per IP (stricter)
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    
    return limiter