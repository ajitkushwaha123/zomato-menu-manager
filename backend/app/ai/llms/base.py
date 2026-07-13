from typing import Type
from pydantic import BaseModel
from abc import ABC, abstractmethod
from langchain_core.language_models import BaseChatModel

class BaseLLMProvider(ABC):
    @abstractmethod
    def get_chat_model(
        self,
        temperature: float = 0,
    ) -> BaseChatModel:
        pass

    @abstractmethod
    def get_structured_chat_model(
        self,
        schema: Type[BaseModel],
        temperature: float = 0,
    ) -> BaseChatModel:
        pass