from __future__ import annotations

import boto3
import mimetypes
from pathlib import Path
from fastapi import UploadFile
from botocore.exceptions import ClientError

class S3StorageService:
    def __init__(
        self,
        bucket_name: str,
        region: str,
        access_key: str,
        secret_key: str,
    ) -> None:
        self.bucket_name = bucket_name
        self.client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    async def upload_files(
        self,
        restaurant_id: str,
        job_id: str,
        files: list[UploadFile],
    ) -> list[str]:
        uploaded_keys: list[str] = []

        for file in files:
            key = self._build_key(
                restaurant_id=restaurant_id,
                job_id=job_id,
                filename=file.filename or "unknown",
            )

            await self.upload_file(file, key)
            uploaded_keys.append(key)
        return uploaded_keys

    async def upload_file(
        self,
        file: UploadFile,
        key: str,
    ) -> str:
        content_type = (
            file.content_type
            or mimetypes.guess_type(file.filename or "")[0]
            or "application/octet-stream"
        )

        file.file.seek(0)
        self.client.upload_fileobj(
            Fileobj=file.file,
            Bucket=self.bucket_name,
            Key=key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )

        return key

    def download_file(self, key: str, download_path: str) -> None:
        self.client.download_file(
            Bucket=self.bucket_name,
            Key=key,
            Filename=download_path,
        )

    def delete(self, key: str) -> None:
        self.client.delete_object(
            Bucket=self.bucket_name,
            Key=key,
        )

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(
                Bucket=self.bucket_name,
                Key=key,
            )
            return True

        except ClientError:
            return False

    def generate_url(self, key: str, expires: int = 3600) -> str:
        return self.client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
            },
            ExpiresIn=expires,
        )

    @staticmethod
    def _build_key(
        restaurant_id: str,
        job_id: str,
        filename: str,
    ) -> str:
        filename = Path(filename).name
        return (
            f"menus/"
            f"{restaurant_id}/"
            f"{job_id}/"
            f"original/"
            f"{filename}"
        )