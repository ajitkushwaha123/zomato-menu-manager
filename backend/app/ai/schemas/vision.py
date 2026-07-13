from pydantic import BaseModel

class VisionImage(BaseModel):
    """
    Represents a single image sent to a Vision model.
    """
    mime_type: str
    data: str