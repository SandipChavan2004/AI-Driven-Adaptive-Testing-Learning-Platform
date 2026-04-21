"""
Debug helper to inspect question counts per subject/difficulty.
Usage:
    python debug_question_counts.py
"""
from collections import defaultdict
from pathlib import Path
import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).parent / ".env")
client = MongoClient(os.getenv("MONGO_URI"))
db = client["cse_adaptive_testing"]


def show_counts():
    counts = defaultdict(lambda: defaultdict(int))
    for doc in db.questions.find({}, {"subject": 1, "difficulty": 1}):
        counts[doc["subject"]][doc["difficulty"]] += 1

    for subject in sorted(counts):
        print(subject)
        for difficulty, count in counts[subject].items():
            print(f"  {difficulty}: {count}")
        print("-" * 20)


if __name__ == "__main__":
    show_counts()

