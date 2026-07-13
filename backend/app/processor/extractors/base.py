import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

class BaseExtractor(ABC):
    @abstractmethod
    def process(self, downloaded_files: list[str]) -> list[dict[str, Any]]:
        """Process the downloaded files and extract raw text/data."""
        pass
