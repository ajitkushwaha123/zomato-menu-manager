from enum import Enum
class UploadType(str, Enum):
    PDF = "pdf"
    IMAGES = "images"
    CSV = "csv"
    EXCEL = "excel"

class JobStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"