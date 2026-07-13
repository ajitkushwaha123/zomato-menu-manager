from fastapi import HTTPException
from app.core.responses import SuccessResponse
from fastapi import APIRouter, File, Form, UploadFile
from app.services.upload_service import UploadService
from app.helpers.validators import validate_required_fields
from app.repositories.menu_upload_job_repository import MenuUploadJobRepository

router = APIRouter(prefix="/api/menu", tags=["Menu"])

upload_service = UploadService()

@router.post("/upload", status_code=202)
async def upload_menu(
    restaurant_id: str | None = Form(default=None),
    files: list[UploadFile] | None = File(default=None),
):
    validate_required_fields(
        restaurant_id=restaurant_id,
        files=files
    )

    job = await upload_service.create_upload_job(
        restaurant_id=restaurant_id,
        files=files,
        allowed_file_extension=["pdf", "csv", "jpeg", "jpg", "webp", "png"],
    )

    return SuccessResponse(
        message="Files uploaded successfully.",
        data=job.model_dump(mode="json"),
    )

@router.get("/upload/{job_id}", status_code=200)
async def get_upload_status(job_id: str):    
    repository = MenuUploadJobRepository()
    job = repository.get_by_job_id(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return SuccessResponse(
        message="Job status retrieved successfully.",
        data=job.model_dump(mode="json"),
    )