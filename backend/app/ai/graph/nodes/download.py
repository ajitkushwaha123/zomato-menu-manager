import os
import logging
from app.models.enums import JobStatus
from app.ai.graph.state import MenuProcessingState

logger = logging.getLogger(__name__)

class DownloadNode:
    def __init__(self, repository, storage):
        self.repository = repository
        self.storage = storage

    def __call__(self, state: MenuProcessingState):
        job_id = state["job_id"]
        temp_dir = state["temp_dir"]
        
        job = self.repository.get_by_job_id(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        self.repository.update_progress(
            job_id,
            status=JobStatus.PROCESSING.value,
            progress=10,
            step="Downloading Files",
        )

        local_paths = []
        for file in job.files:
            local_path = os.path.join(temp_dir, file.filename)
            self.storage.download_file(file.s3_key, local_path)
            local_paths.append(local_path)
            logger.info("Downloaded %s to %s", file.filename, local_path)
            
        return {"downloaded_files": local_paths}
