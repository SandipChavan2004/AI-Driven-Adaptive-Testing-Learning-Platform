"""
Database connection and configuration
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    """Database connection manager"""
    
    def __init__(self):
        self.mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client['cse_adaptive_testing']
        self.users = self.db['users']
        self.tests = self.db['tests']
        self.questions = self.db['questions']
    
    def test_connection(self):
        """Test MongoDB connection"""
        try:
            self.client.admin.command('ping')
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            return False

# Create a global database instance
db = Database()

