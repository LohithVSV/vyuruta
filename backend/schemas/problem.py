from pydantic import BaseModel
from typing import Optional, List
from schemas.topic import TopicOut


class TestCaseOut(BaseModel):
    id: int
    input_data: str
    expected_output: str
    is_sample: bool

    class Config:
        from_attributes = True


class TestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool = False


class ProblemCreate(BaseModel):
    title: str
    slug: str
    description: str
    difficulty: int          # 1, 2, or 3
    topic_names: List[str]   # e.g. ["arrays", "two-pointers"] — created if they don't exist yet
    function_signature: Optional[str] = None
    time_limit_ms: int = 2000
    test_cases: List[TestCaseCreate]


class ProblemOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    difficulty: int
    function_signature: Optional[str]
    time_limit_ms: int
    is_active: bool
    topics: List[TopicOut]

    class Config:
        from_attributes = True


class ProblemDetailOut(ProblemOut):
    sample_test_cases: List[TestCaseOut]