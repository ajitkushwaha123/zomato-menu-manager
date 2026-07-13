from typing import TypedDict, Any

class MenuProcessingState(TypedDict):
    job_id: str
    temp_dir: str
    upload_type: str
    downloaded_files: list[str]
    transcriptions: list[Any]
    parsed_menus: list[Any]
    errors: list[str]
