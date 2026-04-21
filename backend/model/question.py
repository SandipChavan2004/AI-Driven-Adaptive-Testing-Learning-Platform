"""
Question model and operations
"""
from bson import ObjectId
import random

class Question:
    """Question model for database operations"""
    
    @staticmethod
    def get_question(subject, difficulty):
        """Get a random question for subject and difficulty"""
        from .database import db
        
        # Get all questions for this subject and difficulty
        questions = list(db.questions.find({
            'subject': subject,
            'difficulty': difficulty
        }))
        
        if not questions:
            # Return a sample question if none exists
            return {
                'question_id': None,
                'question': f'Sample {difficulty} question for {subject}',
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'correct_answer': 0,
                'difficulty': difficulty,
                'subject': subject
            }
        
        # Return a random question
        question = random.choice(questions)
        return {
            'question_id': str(question['_id']),
            'question': question['question'],
            'options': question['options'],
            'correct_answer': question['correct_answer'],
            'difficulty': question['difficulty'],
            'subject': question['subject']
        }
    
    @staticmethod
    def get_question_by_id(question_id):
        """Get question by ID"""
        from .database import db
        
        question = db.questions.find_one({'_id': ObjectId(question_id)})
        if question:
            return {
                'question_id': str(question['_id']),
                'question': question['question'],
                'options': question['options'],
                'correct_answer': question['correct_answer'],
                'difficulty': question['difficulty'],
                'subject': question['subject']
            }
        return None
    
    @staticmethod
    def count_questions(subject=None, difficulty=None):
        """Count questions in database"""
        from .database import db
        
        query = {}
        if subject:
            query['subject'] = subject
        if difficulty:
            query['difficulty'] = difficulty
        
        return db.questions.count_documents(query)

