from .upload import router as upload_router
from .settings import router as settings_router
from .analyze import router as analyze_router

__all__ = ['upload_router', 'settings_router', 'analyze_router']
