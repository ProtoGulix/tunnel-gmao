from typing import List, Literal

from pydantic import BaseModel


class TemplateFieldEnumIn(BaseModel):
    value: str
    label: str


class TemplateFieldIn(BaseModel):
    key: str
    label: str
    field_type: Literal["text", "number", "enum"]
    required: bool
    order: int = 0
    unit: str = ""
    enum_values: List[TemplateFieldEnumIn] = []


class PartTemplateIn(BaseModel):
    code: str
    pattern: str
    fields: List[TemplateFieldIn]
    label: str = ""
    active: bool = True


class PartTemplateUpdate(BaseModel):
    pattern: str = ""
    fields: List[TemplateFieldIn] = []
