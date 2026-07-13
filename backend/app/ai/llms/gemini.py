from typing import Type
from pydantic import BaseModel
from .base import BaseLLMProvider
from app.core.settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.model = settings.GEMINI_MODEL
        self.api_key = settings.GEMINI_API_KEY

    def get_chat_model(
        self,
        temperature: float = 0,
    ) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=self.api_key,
            temperature=temperature,
        )

    def get_structured_chat_model(
        self,
        schema: Type[BaseModel],
        temperature: float = 0,
    ):
        return (
            self.get_chat_model(
                temperature=temperature,
            )
            .with_structured_output(schema)
        )
