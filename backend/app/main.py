from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.database.session import init_db
from backend.app.api.routes import documents, chat, agents, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DocMind AI platform backend...")
    init_db()
    yield
    logger.info("DocMind AI backend shut down successfully.")

app = FastAPI(
    title="DocMind AI API",
    description="Intelligent Agentic Document Intelligence Platform powered by Groq and Advanced RAG",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(agents.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "DocMind AI - Intelligent Document Intelligence Platform is running",
        "docs_url": "/docs",
        "version": "0.1.0"
    }
