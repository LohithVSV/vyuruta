from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from models.problem import Problem
from models.testcase import TestCase
from models.topic import Topic
from schemas.problem import ProblemCreate, ProblemOut, ProblemDetailOut, TestCaseOut
import random

router = APIRouter(prefix="/problems", tags=["problems"])


def get_or_create_topics(db: Session, names: List[str]) -> List[Topic]:
    topics = []
    for name in names:
        name = name.strip().lower()
        topic = db.query(Topic).filter(Topic.name == name).first()
        if not topic:
            topic = Topic(name=name)
            db.add(topic)
            db.flush()
        topics.append(topic)
    return topics


@router.post("/", response_model=ProblemOut)
def create_problem(payload: ProblemCreate, db: Session = Depends(get_db)):
    existing = db.query(Problem).filter(Problem.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Problem with this slug already exists")
    if payload.difficulty not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="difficulty must be 1, 2, or 3")

    problem = Problem(
        title=payload.title,
        slug=payload.slug,
        description=payload.description,
        difficulty=payload.difficulty,
        function_signature=payload.function_signature,
        time_limit_ms=payload.time_limit_ms,
    )
    problem.topics = get_or_create_topics(db, payload.topic_names)
    db.add(problem)
    db.flush()

    for tc in payload.test_cases:
        db.add(TestCase(
            problem_id=problem.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample,
        ))

    db.commit()
    db.refresh(problem)
    return problem


@router.get("/", response_model=list[ProblemOut])
def list_problems(
    difficulty: Optional[int] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Problem).filter(Problem.is_active == True)
    if difficulty:
        q = q.filter(Problem.difficulty == difficulty)
    if topic:
        q = q.join(Problem.topics).filter(Topic.name == topic.strip().lower())
    return q.all()


@router.get("/{problem_id}", response_model=ProblemDetailOut)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    samples = [tc for tc in problem.test_cases if tc.is_sample]
    return ProblemDetailOut(
        **ProblemOut.model_validate(problem).model_dump(),
        sample_test_cases=[TestCaseOut.model_validate(tc) for tc in samples],
    )


def pick_random_problem(db: Session, difficulty: Optional[int] = None, topic_names: Optional[List[str]] = None) -> Optional[Problem]:
    q = db.query(Problem).filter(Problem.is_active == True)
    if difficulty:
        q = q.filter(Problem.difficulty == difficulty)
    if topic_names:
        q = q.join(Problem.topics).filter(Topic.name.in_([t.lower() for t in topic_names]))
    candidates = q.all()
    return random.choice(candidates) if candidates else None