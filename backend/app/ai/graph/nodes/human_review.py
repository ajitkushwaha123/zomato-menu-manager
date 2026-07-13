import logging
from app.models.enums import JobStatus
from app.ai.graph.state import MenuProcessingState

logger = logging.getLogger(__name__)

class HumanReviewNode:
    def __init__(self, repository):
        self.repository = repository

    def __call__(self, state: MenuProcessingState):
        job_id = state["job_id"]
        
        logger.warning(f"Job {job_id} requires human review due to low AI confidence.")
        
        # When hitting this node for the first time, update status to indicate it's paused for review.
        # LangGraph will pause execution BEFORE this node is executed (due to interrupt_before).
        # Wait, if interrupt_before is used, this node runs AFTER the resume.
        # Let's clarify: if we use interrupt_before=["human_review"], the pipeline pauses *before* this node.
        # So setting status to "NEEDS_REVIEW" should happen before the pause.
        # Alternatively, we can use this node to just log that human review is complete!
        
        logger.info(f"Human review completed for Job {job_id}. Resuming pipeline.")
        
        self.repository.update_progress(
            job_id,
            status=JobStatus.PROCESSING.value,
            progress=50, # Arbitrary progress point after extraction
            step="Human Review Completed",
        )
        
        # Fetch the (potentially edited) transcriptions from the DB to inject back into state
        # Because the human edited the DB, not the LangGraph state!
        job = self.repository.get_by_job_id(job_id)
        if job and job.chain_outputs and "transcriptions" in job.chain_outputs:
            transcriptions = job.chain_outputs["transcriptions"]
            logger.info("Loaded edited transcriptions from database.")
            return {"transcriptions": transcriptions}
            
        return {}
