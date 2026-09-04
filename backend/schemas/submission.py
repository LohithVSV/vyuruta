from pydantic import BaseModel
from typing import List, Optional


class SubmissionRequest(BaseModel):
    code: str


class TestCaseResult(BaseModel):
    is_sample: bool
    passed: bool
    # Detail is only ever populated for sample cases — hidden cases stay hidden.
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    error: Optional[str] = None


class SubmissionResult(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    results: List[TestCaseResult]
    sprint_status: str
    message: str