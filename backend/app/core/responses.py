from typing import Any
from pydantic import BaseModel

class ApiResponse(BaseModel):
    success: bool
    message: str
    code: str | None = None
    data: Any | None = None

class SuccessResponse(ApiResponse):
    success: bool = True


class ErrorResponse(ApiResponse):
    success: bool = False