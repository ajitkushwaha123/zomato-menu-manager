import logging
from app.core.settings import settings
from typing import Callable, Iterable, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

def run_concurrently(
    func: Callable,
    items: Iterable[Any],
    max_workers: int = settings.MAX_CONCURRENT_REQUESTS,
) -> list[Any]:
    """
    Executes a function concurrently over an iterable of items.
    Returns results in the exact same order as the input items.
    If an item fails, its result is replaced with a dictionary containing the error.
    """
    results_with_index = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(func, item): index
            for index, item in enumerate(items)
        }

        for future in as_completed(futures):
            index = futures[future]
            try:
                result = future.result()
                results_with_index.append((index, result))
            except Exception as e:
                logger.error(f"Concurrent task failed at index {index}: {e}")
                results_with_index.append((
                    index,
                    {
                        "status": "failed",
                        "error": str(e),
                    },
                ))
                
    results_with_index.sort(key=lambda x: x[0])
    return [res[1] for res in results_with_index]
