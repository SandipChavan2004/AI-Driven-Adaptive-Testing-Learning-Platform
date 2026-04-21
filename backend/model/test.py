"""
Test model and operations
"""
from datetime import datetime
from bson import ObjectId

class Test:
    """Test model for database operations"""
    
    @staticmethod
    def create_test(user_id, subject):
        """Create a new test session"""
        from .database import db
        
        test = {
            'user_id': user_id,
            'subject': subject,
            'started_at': datetime.utcnow(),
            'questions': [],
            'current_difficulty': 'easy',
            'status': 'in_progress'
        }
        
        result = db.tests.insert_one(test)
        return str(result.inserted_id)
    
    @staticmethod
    def get_test(test_id, user_id=None):
        """Get test by ID"""
        from .database import db
        
        query = {'_id': ObjectId(test_id)}
        if user_id:
            query['user_id'] = user_id
        
        return db.tests.find_one(query)
    
    @staticmethod
    def update_test_difficulty(test_id, next_difficulty):
        """Update test current difficulty"""
        from .database import db
        
        db.tests.update_one(
            {'_id': ObjectId(test_id)},
            {'$set': {'current_difficulty': next_difficulty}}
        )
    
    @staticmethod
    def add_answer(test_id, answer_data):
        """Add answer to test"""
        from .database import db
        
        db.tests.update_one(
            {'_id': ObjectId(test_id)},
            {'$push': {'questions': answer_data}}
        )
    
    @staticmethod
    def finish_test(test_id, analytics):
        """Finish test and save analytics"""
        from .database import db
        
        db.tests.update_one(
            {'_id': ObjectId(test_id)},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow(),
                    'analytics': analytics
                }
            }
        )
    
    @staticmethod
    def get_user_tests(user_id, limit=10):
        """Get user's test history"""
        from .database import db
        
        tests = list(db.tests.find({'user_id': user_id})
                    .sort('started_at', -1)
                    .limit(limit))
        
        test_history = []
        for test in tests:
            analytics = test.get('analytics', {})
            test_history.append({
                'test_id': str(test['_id']),
                'subject': test['subject'],
                'started_at': test['started_at'].isoformat() if isinstance(test['started_at'], datetime) else str(test['started_at']),
                'status': test.get('status', 'in_progress'),
                'capability_score': analytics.get('capability_score', 0),
                'capability_level': analytics.get('final_capability_level', 'N/A'),
                'accuracy': analytics.get('accuracy', 0)
            })
        
        return test_history
    
    @staticmethod
    def calculate_analytics(questions):
        """Calculate test analytics from questions"""
        if not questions:
            return None
        
        total_questions = len(questions)
        correct_answers = sum(1 for q in questions if q['is_correct'])
        accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        avg_time = sum(q['time_taken'] for q in questions) / total_questions if total_questions > 0 else 0
        
        # Difficulty progression
        difficulty_progression = [q['difficulty'] for q in questions]
        
        # Calculate capability score (0-100)
        capability_score = (accuracy * 0.6) + ((100 - min(avg_time, 60)) * 0.4)
        
        # Determine final capability level
        if capability_score >= 70:
            final_level = 'Advanced'
        elif capability_score >= 40:
            final_level = 'Intermediate'
        else:
            final_level = 'Beginner'
        
        # Get weak areas
        weak_areas = [q['question_id'] for q in questions if not q['is_correct']]
        
        return {
            'accuracy': accuracy,
            'avg_time': avg_time,
            'difficulty_progression': difficulty_progression,
            'capability_score': capability_score,
            'final_capability_level': final_level,
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'weak_areas': weak_areas
        }

