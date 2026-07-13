from typing import Any
from fastapi import UploadFile
from app.core.exceptions import ValidationException

def validate_required_fields(**kwargs: Any) -> None:
    """
    Validates that all provided fields are present and not empty.
    Raises ValidationException if any field is missing or empty.
    """
    for field_name, value in kwargs.items():
        if value is None:
            raise ValidationException(message=f"The '{field_name}' field is missing.")
        
        if isinstance(value, str) and not value.strip():
            raise ValidationException(message=f"The '{field_name}' field cannot be empty.")
            
        if hasattr(value, "__len__") and not isinstance(value, UploadFile) and len(value) == 0:
            raise ValidationException(message=f"The '{field_name}' field cannot be empty.")

        if isinstance(value, list):
            for item in value:
                if hasattr(item, "filename") and (not item.filename or getattr(item, "size", None) in (0, None)):
                    raise ValidationException(message=f"The '{field_name}' field contains an empty file.")
                    
        if hasattr(value, "filename") and (not value.filename or getattr(value, "size", None) in (0, None)):
            raise ValidationException(message=f"The '{field_name}' field cannot be an empty file.")
