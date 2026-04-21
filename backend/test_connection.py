"""
Script to test database connection and configuration
"""
from model.database import Database
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the backend directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

def test_connection():
    """Test database connection"""
    print("Testing database connection...")
    mongo_uri = os.getenv('MONGO_URI', 'Not set')
    
    # Mask password in URI for security
    if mongo_uri != 'Not set' and '@' in mongo_uri:
        # Hide password in connection string
        parts = mongo_uri.split('@')
        if len(parts) == 2:
            user_part = parts[0].split('//')[0] + '//' + parts[0].split('//')[1].split(':')[0] + ':***'
            mongo_uri_display = user_part + '@' + parts[1]
        else:
            mongo_uri_display = mongo_uri
    else:
        mongo_uri_display = mongo_uri
    
    print(f"MongoDB URI: {mongo_uri_display}")
    
    db = Database()
    
    if db.test_connection():
        print("[SUCCESS] Database connection successful!")
        
        # Test collections
        print("\nChecking collections...")
        collections = db.db.list_collection_names()
        print(f"Collections found: {collections}")
        
        # Count documents
        print("\nDocument counts:")
        print(f"  Users: {db.users.count_documents({})}")
        print(f"  Tests: {db.tests.count_documents({})}")
        print(f"  Questions: {db.questions.count_documents({})}")
        
        return True
    else:
        print("[FAILED] Database connection failed!")
        print("Please check:")
        print("  1. MongoDB is running (or MongoDB Atlas cluster is accessible)")
        print("  2. MONGO_URI in .env file is correct")
        print("  3. Network connectivity")
        print("  4. For MongoDB Atlas: Check IP whitelist and credentials")
        return False

if __name__ == '__main__':
    test_connection()

