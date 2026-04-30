"""
Quick script to check .env file and test connection
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).parent / '.env'
print(f"Looking for .env at: {env_path}")
print(f".env file exists: {env_path.exists()}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print("\nEnvironment variables loaded:")
    mongo_uri = os.getenv('MONGO_URI')
    jwt_key = os.getenv('JWT_SECRET_KEY')
    youtube_key = os.getenv('YOUTUBE_API_KEY')
    
    print(f"MONGO_URI: {'SET' if mongo_uri else 'NOT SET'}")
    if mongo_uri:
        # Mask password for security
        if '@' in mongo_uri:
            parts = mongo_uri.split('@')
            if len(parts) == 2:
                user_part = parts[0].split('//')[0] + '//' + parts[0].split('//')[1].split(':')[0] + ':***'
                print(f"  Value: {user_part}@{parts[1]}")
            else:
                print(f"  Value: {mongo_uri[:50]}...")
        else:
            print(f"  Value: {mongo_uri}")
    
    print(f"JWT_SECRET_KEY: {'SET' if jwt_key else 'NOT SET'}")
    print(f"YOUTUBE_API_KEY: {'SET' if youtube_key else 'NOT SET'}")
    
    openai_key = os.getenv('OPENAI_API_KEY')
    print(f"OPENAI_API_KEY: {'SET' if openai_key else 'NOT SET'}")
    
    # Now test connection
    if mongo_uri:
        print("\n" + "="*50)
        print("Testing MongoDB connection...")
        from pymongo import MongoClient
        try:
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            print("[SUCCESS] Connection successful!")
            
            db = client['cse_adaptive_testing']
            collections = db.list_collection_names()
            print(f"Collections: {collections}")
        except Exception as e:
            print(f"[FAILED] Connection error: {e}")
    else:
        print("\n[ERROR] MONGO_URI is not set in .env file")
        print("Please add: MONGO_URI=your_connection_string")
    
    # Test OpenAI API
    if openai_key:
        print("\n" + "="*50)
        print("Testing OpenAI API connection...")
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            # Simple test: list models
            models = client.models.list()
            print("[SUCCESS] OpenAI API connection successful!")
            print(f"Available models: {len(models.data)} models")
        except Exception as e:
            print(f"[FAILED] OpenAI API error: {e}")
    else:
        print("\n[INFO] OPENAI_API_KEY not set - AI features disabled")
else:
    print("\n[ERROR] .env file not found!")
    print("Please create a .env file in the backend folder with:")
    print("MONGO_URI=your_connection_string")
    print("JWT_SECRET_KEY=your_secret_key")
    print("YOUTUBE_API_KEY=your_youtube_key")

