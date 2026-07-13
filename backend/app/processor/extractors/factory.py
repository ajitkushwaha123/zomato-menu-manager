import logging
from app.models.enums import UploadType
from app.processor.extractors.base import BaseExtractor
from app.processor.extractors.image import ImageProcessor

logger = logging.getLogger(__name__)

class UploadProcessorFactory:
    @staticmethod
    def get(upload_type: UploadType) -> BaseExtractor:
        if upload_type == UploadType.IMAGES:
            return ImageProcessor()
        else:
            raise ValueError(f"No processor found for upload_type: {upload_type}")
