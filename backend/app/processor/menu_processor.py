import logging
import tempfile
from app.services.storage.s3 import S3StorageService
from app.repositories.menu_upload_job_repository import MenuUploadJobRepository
from app.ai.graph.workflow import build_workflow

logger = logging.getLogger(__name__)

class MenuProcessor:
    def __init__(
        self,
        repository: MenuUploadJobRepository,
        storage: S3StorageService,
    ):
        self.repository = repository
        self.storage = storage
        self.graph = build_workflow(repository, storage)

    def process(self, job_id: str):
        job = self.repository.get_by_job_id(job_id)

        if not job:
            raise ValueError(f"Job {job_id} not found.")

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                initial_state = {
                    "job_id": job_id,
                    "temp_dir": temp_dir,
                    "upload_type": job.upload_type,
                    "downloaded_files": [],
                    "transcriptions": [],
                    "parsed_menus": [],
                    "errors": []
                }
                
                self.graph.invoke(
                    initial_state,
                    config={"configurable": {"thread_id": job_id}}
                )

        except Exception as e:
            logger.error("Job %s failed: %s", job_id, str(e), exc_info=True)
            self.repository.mark_failed(
                job_id=job_id,
                error=str(e),
            )
            raise

    def resume(self, job_id: str):
        job = self.repository.get_by_job_id(job_id)

        if not job:
            raise ValueError(f"Job {job_id} not found.")

        try:
            logger.info(f"Resuming job {job_id} from human review...")
            
            # Since LangGraph automatically picks up from the last checkpoint
            # using the thread_id, we just pass None as the input state
            self.graph.invoke(
                None,
                config={"configurable": {"thread_id": job_id}}
            )

        except Exception as e:
            logger.error("Job %s resume failed: %s", job_id, str(e), exc_info=True)
            self.repository.mark_failed(
                job_id=job_id,
                error=str(e),
            )
            raise
