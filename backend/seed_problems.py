"""
Paste problems here as dicts and run: python seed_problems.py
"""
from database import SessionLocal
from models.problem import Problem
from models.testcase import TestCase

PROBLEMS = [
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "description": "Given a list of integers and a target, print the indices of the two numbers that add up to the target.",
        "difficulty": "easy",
        "cluster": "Agni",
        "function_signature": "def two_sum(nums, target):",
        "test_cases": [
            {"input_data": "[2,7,11,15]\n9", "expected_output": "[0, 1]", "is_sample": True},
            {"input_data": "[3,2,4]\n6", "expected_output": "[1, 2]", "is_sample": False},
        ],
    },
]

def seed():
    db = SessionLocal()
    try:
        for p in PROBLEMS:
            if db.query(Problem).filter(Problem.slug == p["slug"]).first():
                print(f"Skipping {p['slug']} (already exists)")
                continue
            problem = Problem(
                title=p["title"], slug=p["slug"], description=p["description"],
                difficulty=p["difficulty"], cluster=p.get("cluster"),
                function_signature=p.get("function_signature"),
            )
            db.add(problem)
            db.flush()
            for tc in p["test_cases"]:
                db.add(TestCase(problem_id=problem.id, **tc))
            print(f"Seeded {p['slug']}")
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed()