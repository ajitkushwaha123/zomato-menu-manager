from pydantic import BaseModel, Field

class VariantOption(BaseModel):
    name: str = Field(..., description="Variant option name.")

    price: str | None = Field(
        default=None,
        description="Price exactly as written in menu."
    )

class Variant(BaseModel):
    property_name: str = Field(
        ...,
        description="Variant property name."
    )

    options: list[VariantOption] = Field(
        ...,
        min_length=2,
        description="Variant options. Must contain at least two options."
    )

class ParsedMenuItem(BaseModel):
    name: str
    category: str
    sub_category: str
    description: str | None = None
    base_price: str | None = None
    variants: list[Variant] = Field(default_factory=list)
    source_text: str

class ParsedMenu(BaseModel):
    items: list[ParsedMenuItem]