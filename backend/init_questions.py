"""
Script to initialize the database with sample questions for all subjects.
Run this script to populate the questions collection with comprehensive question sets.
"""

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['cse_adaptive_testing']
questions_collection = db['questions']

CSE_SUBJECTS = [
    "Data Structures and Algorithms", "Database Management Systems", "Operating Systems",
    "Computer Networks", "Python Programming", "Java Programming", "Artificial Intelligence",
    "Machine Learning", "Cloud Computing", "Cyber Security", "Software Engineering",
    "Web Development", "Mobile App Development", "Computer Graphics", "Compiler Design",
    "Distributed Systems", "Data Mining", "Natural Language Processing", "Computer Vision",
    "Blockchain Technology", "Internet of Things", "Big Data Analytics", "DevOps",
    "Microservices Architecture", "System Design", "Object-Oriented Programming",
    "Data Science", "Deep Learning", "Quantum Computing", "Robotics"
]

def generate_questions():
    """Generate sample questions for all subjects and difficulty levels."""
    questions = []
    
    for subject in CSE_SUBJECTS:
        # Easy questions
        for i in range(5):
            questions.append({
                'subject': subject,
                'difficulty': 'easy',
                'question': f'What is a basic concept in {subject}? (Easy Question {i+1})',
                'options': [
                    f'Option A: Basic concept {i+1}',
                    f'Option B: Intermediate concept {i+1}',
                    f'Option C: Advanced concept {i+1}',
                    f'Option D: Complex concept {i+1}'
                ],
                'correct_answer': 0
            })
        
        # Moderate-1 questions
        for i in range(5):
            questions.append({
                'subject': subject,
                'difficulty': 'moderate-1',
                'question': f'Which approach is commonly used in {subject}? (Moderate-1 Question {i+1})',
                'options': [
                    f'Option A: Approach {i+1}',
                    f'Option B: Alternative approach {i+1}',
                    f'Option C: Advanced approach {i+1}',
                    f'Option D: Complex approach {i+1}'
                ],
                'correct_answer': 1
            })
        
        # Moderate-2 questions
        for i in range(5):
            questions.append({
                'subject': subject,
                'difficulty': 'moderate-2',
                'question': f'How would you implement a solution for {subject}? (Moderate-2 Question {i+1})',
                'options': [
                    f'Option A: Simple implementation {i+1}',
                    f'Option B: Standard implementation {i+1}',
                    f'Option C: Optimized implementation {i+1}',
                    f'Option D: Complex implementation {i+1}'
                ],
                'correct_answer': 2
            })
        
        # Hard questions
        for i in range(5):
            questions.append({
                'subject': subject,
                'difficulty': 'hard',
                'question': f'What is the most efficient way to solve complex problems in {subject}? (Hard Question {i+1})',
                'options': [
                    f'Option A: Basic method {i+1}',
                    f'Option B: Standard method {i+1}',
                    f'Option C: Advanced method {i+1}',
                    f'Option D: Optimal method {i+1}'
                ],
                'correct_answer': 3
            })
    
    return questions

if __name__ == '__main__':
    print("Initializing questions database...")
    
    # Clear existing questions (optional - comment out if you want to keep existing)
    # questions_collection.delete_many({})
    
    # Generate and insert questions
    questions = generate_questions()
    result = questions_collection.insert_many(questions)
    
    print(f"Successfully inserted {len(result.inserted_ids)} questions!")
    print(f"Questions per subject: 20 (5 easy + 5 moderate-1 + 5 moderate-2 + 5 hard)")
    print(f"Total subjects: {len(CSE_SUBJECTS)}")

