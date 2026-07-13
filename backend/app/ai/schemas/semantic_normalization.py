from pydantic import BaseModel
from typing import List

class NormalizationItem(BaseModel):
    id: str
    name: str
    category: str
    sub_category: str

class NormalizedItem(BaseModel):
    id: str
    name: str
    is_veg: str

class SubCategory(BaseModel):
    name: str
    items: List[NormalizedItem]

class Category(BaseModel):
    name: str
    sub_category: List[SubCategory]

class NormalizationResponse(BaseModel):
    category: List[Category]