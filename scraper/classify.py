"""
Rule-based classification (cheap, deterministic, no AI cost).
Add an AI fallback later only for titles that don't match any keyword.
"""

RULES = [
    ("ADMIT_CARD", ["admit card", "call letter", "hall ticket"]),
    ("ANSWER_KEY", ["answer key", "model answer"]),
    ("RESULT", ["result", "merit list", "selection list", "cut off", "cutoff"]),
    ("SYLLABUS", ["syllabus", "exam pattern"]),
    ("JOB", ["recruitment", "vacancy", "advertisement", "bharti", "notification for post"]),
    ("NOTIFICATION", ["notice", "notification", "circular", "corrigendum"]),
]


def classify(title: str) -> str:
    text = title.lower()
    for category, keywords in RULES:
        if any(kw in text for kw in keywords):
            return category
    return "NOTIFICATION"  # safe default if nothing matches
