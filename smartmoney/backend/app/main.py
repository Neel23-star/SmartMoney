from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import signals
from .scheduler import start_scheduler
from .database import init_db
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Smart Money Screener API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)


@app.on_event("startup")
def startup():
    init_db()
    start_scheduler()
