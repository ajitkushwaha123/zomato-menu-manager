from fastapi import UploadFile
from abc import ABC, abstractmethod

class StorageService(ABC):
    @abstractmethod
    async def upload_files(
        self,
        job_id: str,
        files: list[UploadFile],
    ) -> list[str]:
        pass