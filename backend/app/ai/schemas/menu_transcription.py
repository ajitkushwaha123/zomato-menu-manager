from pydantic import BaseModel, Field

class MenuTranscription(BaseModel):
    """
    Canonical markdown representation of the menu.

    This is NOT the final menu schema.
    It is simply the menu rewritten into a clean
    top-to-bottom markdown document.
    """

    markdown: str = Field(
        description="""
Restaurant menu converted into markdown.

Requirements:
- Preserve categories
- Preserve items
- Preserve prices
- Preserve descriptions
- Preserve variants
- Convert multi-column layouts into one reading order
- Ignore logos
- Ignore QR codes
- Ignore address
- Ignore phone numbers
- Do not normalize
- Do not infer missing information
"""
    )
    
    confidence_score: float = Field(
        ...,
        description="Confidence score between 0.0 and 1.0 indicating how sure you are about the transcription accuracy."
    )
    
    confidence_reasoning: str = Field(
        ...,
        description="Brief explanation of why you gave this confidence score, especially if it is below 0.8."
    )