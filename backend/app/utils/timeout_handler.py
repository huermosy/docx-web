import asyncio
from functools import wraps
from typing import TypeVar, Callable

T = TypeVar('T')


def with_timeout(seconds: int, default=None):
    """超时装饰器"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                return default
        return wrapper
    return decorator
