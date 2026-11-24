import os
from pathlib import Path
from dotenv import load_dotenv

from app.core.logger import logger

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


class Settings:
    def __init__(self) -> None:
        self.groq_api_key: str = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()
        self.groq_vision_model: str = os.getenv(
            "GROQ_VISION_MODEL", "qwen/qwen3.8-27b"
        ).strip()

    @property
    def has_valid_groq_key(self) -> bool:
        return bool(self.groq_api_key) and self.groq_api_key != "gsk_your_key_here"


settings = Settings()

if settings.has_valid_groq_key:
    logger.info(
        f"Groq AI configured (text_model='{settings.groq_model}', vision_model='{settings.groq_vision_model}')"
    )
else:
    logger.warning(
        f"GROQ_API_KEY not found or placeholder in {ENV_PATH}. AI endpoints will return 503 until configured."
    )
