import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    ENV = os.getenv("APP_ENV", "development").lower()
    DEBUG = ENV != "production"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
    DATABASE = BASE_DIR / "data" / ("finance_prod.db" if ENV == "production" else "finance_dev.db")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("HTTPS", "0") == "1"
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8

if Config.ENV == "production" and Config.SECRET_KEY == "dev-only-change-me":
    raise RuntimeError("Production requires a strong SECRET_KEY environment variable")
