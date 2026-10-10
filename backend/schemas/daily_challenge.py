from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel

from schemas.problem import ProblemDetailOut
from schemas.submission import TestCaseResult


class DailyAttemptOut(BaseModel):
    status: Literal["in_progress", "solved", "forfeited"]
    started_at: datetime
    completed_at: Optional[datetime] = None
    solve_time_seconds: Optional[int] = None


class DailyChallengeOut(BaseModel):
    challenge_date: date
    reward: int
    problem: ProblemDetailOut
    attempt: DailyAttemptOut


class DailySubmissionResult(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    hidden_test_count: int
    results: list[TestCaseResult]
    status: Literal["in_progress", "solved", "forfeited"]
    reward: int
    message: str


class DailyLeaderboardEntry(BaseModel):
    rank: int
    username: str
    status: Literal["solved", "forfeited"]
    solve_time_seconds: Optional[int] = None
    completed_at: datetime


class DailyLeaderboardOut(BaseModel):
    challenge_date: date
    reward: int
    entries: list[DailyLeaderboardEntry]
