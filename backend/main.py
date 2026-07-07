from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.routes import router
from app.api.auth_routes import router as auth_router

app = FastAPI(
    title="MediAssist AI",
    description="Intelligent Healthcare Document Assistant",
    version="1.0.0"
)

# Allow React frontend to talk to backend.
# In DEBUG mode we stay permissive (wildcard) so local dev "just works"
# regardless of which port Vite happens to pick. In production (DEBUG=false),
# we lock this down to the configured FRONTEND_URL only.
if settings.DEBUG:
    allowed_origins = ["*"]
else:
    allowed_origins = [settings.FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    init_db()  # creates data/users.db + users table if they don't exist yet


app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "🏥 Welcome to MediAssist AI!", "docs": "/docs"}