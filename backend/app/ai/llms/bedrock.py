from typing import Type
from pydantic import BaseModel
from .base import BaseLLMProvider
from app.core.settings import settings
from langchain_aws import ChatBedrock

class BedrockProvider(BaseLLMProvider):
    def __init__(self):
        self.model_id = settings.BEDROCK_MODEL
        self.region = settings.AWS_REGION
        self.access_key = settings.AWS_ACCESS_KEY_ID
        self.secret_key = settings.AWS_SECRET_ACCESS_KEY

    def get_chat_model(
        self,
        temperature: float = 0,
    ) -> ChatBedrock:
        import boto3
        
        client = boto3.client(
            "bedrock-runtime",
            region_name=self.region,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        )
        
        return ChatBedrock(
            client=client,
            model_id=self.model_id,
            model_kwargs={"temperature": temperature},
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
