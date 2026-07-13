from abc import ABC, abstractmethod
from app.ai.schemas.vision import VisionImage
from app.ai.schemas.menu_transcription import MenuTranscription


class BaseVisionExtractor(ABC):
    @abstractmethod
    def extract(
        self,
        images: list[VisionImage],
    ) -> MenuTranscription:
        pass