from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router

app = FastAPI(
    title="MediAssist AI",
    description="Intelligent Healthcare Document Assistant",
    version="1.0.0"
)

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All our routes start with /api
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "🏥 Welcome to MediAssist AI!", "docs": "/docs"}