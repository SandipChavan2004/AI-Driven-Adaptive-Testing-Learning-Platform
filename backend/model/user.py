"""
User model and operations
"""
from datetime import datetime
import bcrypt
from bson import ObjectId

class User:
    """User model for database operations"""
    
    @staticmethod
    def create_user(email, password, name, interests=None, capability_level='Beginner'):
        """Create a new user"""
        from .database import db
        
        # Check if user exists
        if db.users.find_one({'email': email}):
            return None, 'User already exists'
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user document
        user = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'interests': interests or [],
            'capability_level': capability_level,
            'created_at': datetime.utcnow()
        }
        
        result = db.users.insert_one(user)
        user['_id'] = result.inserted_id
        user.pop('password')  # Remove password from return
        return user, None
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate user and return user data if valid"""
        from .database import db
        
        user = db.users.find_one({'email': email})
        if not user:
            return None, 'Invalid credentials'
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return None, 'Invalid credentials'
        
        # Remove password from return
        user.pop('password')
        return user, None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        from .database import db
        
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if user:
            user.pop('password', None)  # Remove password if exists
        return user
    
    @staticmethod
    def get_user_dashboard(user_id):
        """Get user dashboard data"""
        from .database import db
        from .test import Test
        
        user = User.get_user_by_id(user_id)
        if not user:
            return None
        
        # Get recent tests
        tests = Test.get_user_tests(user_id, limit=10)
        
        return {
            'user': {
                'id': str(user['_id']),
                'name': user.get('name'),
                'email': user.get('email'),
                'interests': user.get('interests', []),
                'capability_level': user.get('capability_level', 'Beginner')
            },
            'test_history': tests
        }

