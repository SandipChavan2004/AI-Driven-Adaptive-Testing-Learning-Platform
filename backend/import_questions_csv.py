"""
CSV question importer
Usage:
    python import_questions_csv.py
"""
import csv
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).parent
ENV_PATH = BASE_DIR / ".env"
CSV_FILE = BASE_DIR / "questions.csv"

load_dotenv(ENV_PATH)
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in .env")

client = MongoClient(MONGO_URI)
db = client["cse_adaptive_testing"]
questions_collection = db["questions"]

OPTION_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}
REQUIRED_COLS = {"subject", "difficulty", "question", "a", "b", "c", "d", "correct"}
DIFFICULTY_MAP = {
    "easy": "easy",
    "medium": "moderate-1",
    "moderate": "moderate-1",
    "moderate-1": "moderate-1",
    "moderate_1": "moderate-1",
    "moderate1": "moderate-1",
    "moderate-2": "moderate-2",
    "moderate_2": "moderate-2",
    "moderate2": "moderate-2",
    "hard": "hard",
}


def _normalize_row(row: dict) -> dict:
    """Return a lowercase-keyed copy of the row (handles BOM and spacing)."""
    normalized = {}
    for key, value in row.items():
        if key is None:
            continue
        normalized[key.strip().lower()] = (value or "").strip()
    return normalized


def _get_option(row: dict, key: str) -> str:
    """Return option value; allow blank text but key must exist."""
    value = row.get(key.lower())
    if value is None:
        # also support legacy option_* headers
        value = row.get(f"option_{key.lower()}")
    if value is None:
        raise KeyError(f"Missing option column for '{key}' in row: {row}")
    return value


def _normalize_difficulty(value: str) -> str:
    key = value.strip().lower().replace(" ", "")
    if key in ("moderate1", "moderate-1", "moderate_1"):
        key = "moderate-1"
    elif key in ("moderate2", "moderate-2", "moderate_2"):
        key = "moderate-2"
    else:
        key = value.strip().lower()
    normalized = DIFFICULTY_MAP.get(key)
    if not normalized:
        raise ValueError(f"Unknown difficulty '{value}'")
    return normalized


def import_questions():
    if not CSV_FILE.exists():
        raise FileNotFoundError(f"CSV file not found at {CSV_FILE}")

    docs = []

    with CSV_FILE.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = {name.strip().lower() for name in (reader.fieldnames or [])}
        missing = REQUIRED_COLS - fieldnames
        if missing:
            raise ValueError(
                "CSV missing required columns: "
                + ", ".join(sorted(missing))
                + "\nExpected columns: subject,difficulty,question,topic(optional),A,B,C,D,correct"
            )

        for raw_row in reader:
            row = _normalize_row(raw_row)

            correct = row["correct"].upper()
            if correct not in OPTION_MAP:
                raise ValueError(f"Invalid correct option '{correct}' in row: {row}")

            docs.append(
                {
                    "subject": row["subject"],
                    "topic": row.get("topic", ""),
                    "difficulty": _normalize_difficulty(row["difficulty"]),
                    "question": row["question"],
                    "options": [
                        _get_option(row, "A"),
                        _get_option(row, "B"),
                        _get_option(row, "C"),
                        _get_option(row, "D"),
                    ],
                    "correct_answer": OPTION_MAP[correct],
                }
            )

    subjects = sorted({doc["subject"] for doc in docs})
    questions_collection.delete_many({"subject": {"$in": subjects}})
    questions_collection.insert_many(docs)

    print(f"Imported {len(docs)} questions for {len(subjects)} subjects.")


if __name__ == "__main__":
    import_questions()