from pydantic import BaseModel

class UploadedFile(BaseModel):
    filename: str
    content_type: str
    s3_key: str
    size: int