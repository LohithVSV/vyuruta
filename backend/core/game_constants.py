"""
Central place for game-balance numbers so battles.py and sprints.py
stay in sync. Tune these freely — nothing else needs to change when you do.
"""

DIFFICULTY_EASY = 1
DIFFICULTY_MEDIUM = 2
DIFFICULTY_HARD = 3

VALID_DIFFICULTIES = (DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD)

BATTLE_DURATION_MINUTES = {
    DIFFICULTY_EASY: 5,
    DIFFICULTY_MEDIUM: 10,
    DIFFICULTY_HARD: 30,
}

# What a sprint winner earns per win, by difficulty. Placeholder numbers — tune later.
WIN_REWARDS = {
    DIFFICULTY_EASY: {"currency": 500},
    DIFFICULTY_MEDIUM: {"currency": 1000},
    DIFFICULTY_HARD: {"currency": 2000},
}

# Automatic treasure transfer from loser to winner, by difficulty.
TRIBUTE_PAYMENT_BY_DIFFICULTY = {
    DIFFICULTY_EASY: 2000,
    DIFFICULTY_MEDIUM: 4000,
    DIFFICULTY_HARD: 8000,
}