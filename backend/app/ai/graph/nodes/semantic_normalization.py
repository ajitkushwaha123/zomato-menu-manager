import logging
from app.models.enums import JobStatus
from app.ai.graph.state import MenuProcessingState
from app.ai.chains.semantic_normalization import SemanticNormalizationChain
from app.ai.schemas.semantic_normalization import NormalizationItem

logger = logging.getLogger(__name__)

class SemanticNormalizationNode:
    def __init__(self, repository):
        self.repository = repository
        self.chain = SemanticNormalizationChain()

    def __call__(self, state: MenuProcessingState):
        job_id = state["job_id"]
        
        self.repository.update_progress(
            job_id,
            status=JobStatus.PROCESSING.value,
            progress=95,
            step="Semantic Normalization",
        )
        
        job = self.repository.get_by_job_id(job_id)
        if not job or "merged_items" not in job.chain_outputs:
            logger.warning("No merged_items found in job for normalization")
            return {}
            
        merged_items_dict = job.chain_outputs["merged_items"]
        items = merged_items_dict.get("items", [])
        
        normalization_items = []
        for item in items:
            normalization_items.append(
                NormalizationItem(
                    id=item.get("id", ""),
                    name=item.get("name", ""),
                    category=item.get("category", ""),
                    sub_category=item.get("sub_category", "")
                )
            )
            
        logger.info(f"Running Semantic Normalization on {len(normalization_items)} items")
        response = self.chain.invoke(normalization_items)
        
        response_dict = response.model_dump(mode="json")
        
        # Merge back original item details
        original_items_map = {str(item.get("id")): item for item in items}
        
        for category in response_dict.get("category", []):
            for sub_category in category.get("sub_category", []):
                for item in sub_category.get("items", []):
                    item_id = str(item.get("id"))
                    original_item = original_items_map.get(item_id, {})
                    
                    if "base_price" in original_item:
                        item["base_price"] = original_item["base_price"]
                    if "description" in original_item:
                        item["description"] = original_item["description"]
                    if "variants" in original_item:
                        item["variants"] = original_item["variants"]
        
        self.repository.update_chain_output(
            job_id, 
            "normalized_menu", 
            response_dict
        )
        
        # Map response to expected menu schema
        import uuid
        menu_array = []
        for cat in response_dict.get("category", []):
            mapped_cat = {
                "id": f"temp-{uuid.uuid4().hex[:8]}",
                "name": cat.get("name", ""),
                "temp_id": "",
                "sub_category": []
            }
            for sub in cat.get("sub_category", []):
                mapped_sub = {
                    "id": f"temp-{uuid.uuid4().hex[:8]}",
                    "name": sub.get("name", ""),
                    "temp_id": "",
                    "items": []
                }
                for item in sub.get("items", []):
                    item["id"] = f"temp-{uuid.uuid4().hex[:8]}"
                    mapped_sub["items"].append(item)
                mapped_cat["sub_category"].append(mapped_sub)
            menu_array.append(mapped_cat)
            
        # Save to menu document
        from app.repositories.menu_repository import MenuRepository
        menu_repo = MenuRepository()
        menu_repo.upsert_menu(job.restaurant_id, "swiggy", menu_array, append=True)
        
        self.repository.update_status(
            job_id,
            JobStatus.COMPLETED.value,
        )
        
        return {}
