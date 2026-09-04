"""
Central place for game-balance numbers so battles.py and sprints.py
stay in sync. Tune these freely — nothing else needs to change when you do.
"""

DIFFICULTY_EASY = 1
DIFFICULTY_MEDIUM = 2
DIFFICULTY_HARD = 3

VALID_DIFFICULTIES = (DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD)

# What a sprint winner earns per win, by difficulty. Placeholder numbers — tune later.
WIN_REWARDS = {
    DIFFICULTY_EASY: {"currency": 500, "xp": 50},
    DIFFICULTY_MEDIUM: {"currency": 1000, "xp": 100},
    DIFFICULTY_HARD: {"currency": 2000, "xp": 250},
}

# Loser's one-time lump-sum payment option, by difficulty.
TRIBUTE_PAYMENT_BY_DIFFICULTY = {
    DIFFICULTY_EASY: 2000,
    DIFFICULTY_MEDIUM: 4000,
    DIFFICULTY_HARD: 8000,
}

# Loser's ongoing tax-rate option (levied on future XP earnings, not currency), by difficulty.
# Also used as the escalation step when a debtor loses again while already taxed.
TRIBUTE_TAX_RATE_BY_DIFFICULTY = {
    DIFFICULTY_EASY: 1,
    DIFFICULTY_MEDIUM: 2,
    DIFFICULTY_HARD: 5,
}