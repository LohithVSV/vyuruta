"""
Daily questions are keyed to a UTC calendar date. Add each day's problem and
sample/hidden tests here, then run from backend/: python seed_daily_problems.py

Test case input_data is passed to the solution on stdin; expected_output is
compared with stdout. Mark examples shown in the prompt as is_sample=True.
"""
from datetime import date

from database import SessionLocal
from models.daily_challenge import DailyChallenge
from models.problem import Problem
from models.testcase import TestCase
from models.topic import Topic

DAILY_PROBLEMS = [
    {
        "date": "2026-10-10",
        "title": "Daily Sum",
        "slug": "daily-sum-2026-10-10",
        "difficulty": 1,
        "description": (
            "Given two integers, print their sum.\n\n"
            "Input: two space-separated integers a and b.\n"
            "Output: one integer, a + b."
        ),
        "topic_names": ["math"],
        "time_limit_ms": 2000,
        "test_cases": [
            {
                "input_data": "2 3",
                "expected_output": "5",
                "is_sample": True,
            },
            {
                "input_data": "-4 9",
                "expected_output": "5",
                "is_sample": True,
            },
            {
                "input_data": "0 0",
                "expected_output": "0",
                "is_sample": False,
            },
            {
                "input_data": "123456 789012",
                "expected_output": "912468",
                "is_sample": False,
            },
            {
                "input_data": "-1000000 -2500000",
                "expected_output": "-3500000",
                "is_sample": False,
            },
        ],
    },
]


def _get_or_create_topic(db, name: str) -> Topic:
    normalized_name = name.strip().lower()
    topic = db.query(Topic).filter(Topic.name == normalized_name).first()
    if topic is None:
        topic = Topic(name=normalized_name)
        db.add(topic)
        db.flush()
    return topic


def seed() -> None:
    db = SessionLocal()
    try:
        for daily_problem in DAILY_PROBLEMS:
            challenge_date = date.fromisoformat(daily_problem["date"])
            existing_challenge = (
                db.query(DailyChallenge)
                .filter(DailyChallenge.challenge_date == challenge_date)
                .first()
            )
            if existing_challenge is not None:
                print(f"Skipping {challenge_date}: a daily question is already seeded")
                continue

            existing_problem = (
                db.query(Problem)
                .filter(Problem.slug == daily_problem["slug"])
                .first()
            )
            if existing_problem is not None:
                raise ValueError(
                    f"Problem slug {daily_problem['slug']!r} already exists "
                    "without a daily challenge"
                )

            problem = Problem(
                title=daily_problem["title"],
                slug=daily_problem["slug"],
                description=daily_problem["description"],
                difficulty=daily_problem["difficulty"],
                time_limit_ms=daily_problem.get("time_limit_ms", 2000),
            )
            problem.topics = [
                _get_or_create_topic(db, topic_name)
                for topic_name in daily_problem.get("topic_names", [])
            ]
            db.add(problem)
            db.flush()

            db.add_all(
                TestCase(problem_id=problem.id, **test_case)
                for test_case in daily_problem["test_cases"]
            )
            db.add(
                DailyChallenge(
                    challenge_date=challenge_date,
                    problem_id=problem.id,
                )
            )
            print(f"Seeded {challenge_date}: {daily_problem['slug']}")

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
