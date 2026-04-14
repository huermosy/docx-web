from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.upload import router as upload_router
from .api.settings import router as settings_router
from .api.analyze import router as analyze_router
from .api.report import router as report_router

app = FastAPI(title="Word Quality Control API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(settings_router)
app.include_router(analyze_router)
app.include_router(report_router)


@app.get("/")
async def root():
    return {"message": "Word Quality Control API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
