import logging
from fastapi import FastAPI
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, scanner, github

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="monSmith API")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(scanner.router, prefix="/api/v1/scanner", tags=["scanner"])
app.include_router(github.router, prefix="/api/v1/github", tags=["github"])

# Direct callback for GitHub OAuth as requested
@app.get("/auth/callback")
async def github_root_callback(code: str, state: Optional[str] = None):
    return await github.github_callback(code, state)

@app.get("/")
async def root():
    return {"message": "Welcome to monSmith API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
