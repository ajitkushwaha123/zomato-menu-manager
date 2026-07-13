from functools import lru_cache
from app.ai.llms.open_ai import OpenAIProvider
from app.ai.llms.bedrock import BedrockProvider
from app.ai.llms.gemini import GeminiProvider

class LLMFactory:
    @staticmethod
    @lru_cache
    def openai() -> OpenAIProvider:
        return OpenAIProvider()
        
    @staticmethod
    @lru_cache
    def bedrock() -> BedrockProvider:
        return BedrockProvider()
        
    @staticmethod
    @lru_cache
    def gemini() -> GeminiProvider:
        return GeminiProvider()