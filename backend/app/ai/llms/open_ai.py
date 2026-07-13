from typing import Type
from pydantic import BaseModel
from .base import BaseLLMProvider
from app.core.settings import settings
from langchain_openai import ChatOpenAI

class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self.model = settings.OPENAI_MODEL
        self.api_key = settings.OPENAI_API_KEY

    def get_chat_model(
        self,
        temperature: float = 0,
    ) -> ChatOpenAI:

        return ChatOpenAI(
            api_key=self.api_key,
            model=self.model,
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