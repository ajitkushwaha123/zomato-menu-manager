import logging
from app.models.enums import JobStatus
from app.ai.graph.state import MenuProcessingState
from app.processor.extractors.factory import UploadProcessorFactory

logger = logging.getLogger(__name__)

class ExtractNode:
    def __init__(self, repository):
        self.repository = repository

    def __call__(self, state: MenuProcessingState):
        job_id = state["job_id"]
        
        self.repository.update_progress(
            job_id,
            status=JobStatus.PROCESSING.value,
            progress=30,
            step="Extracting Text",
        )
        
        extractor = UploadProcessorFactory.get(state["upload_type"])
        transcriptions = extractor.process(state["downloaded_files"])
        
        transcription_dicts = [
            t.model_dump(mode="json") if hasattr(t, "model_dump") else t
            for t in transcriptions
        ]
        self.repository.update_chain_output(job_id, "transcriptions", transcription_dicts)
        
        return {"transcriptions": transcriptions}
