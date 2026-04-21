from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta, timezone
import bcrypt
import os
from dotenv import load_dotenv
import json
import re
from urllib.parse import quote_plus
from googleapiclient.discovery import build

load_dotenv()

try:
    from openai import OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        AI_ENABLED = True
    else:
        AI_ENABLED = False
except ImportError:
    AI_ENABLED = False

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-change-in-prod-!@#$%')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=60)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
CORS(app)
jwt = JWTManager(app)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["300 per hour"],
        storage_uri="memory://"
    )
    RATE_LIMITING_ENABLED = True
except ImportError:
    # Flask-Limiter not installed yet; run: pip install flask-limiter
    limiter = None
    RATE_LIMITING_ENABLED = False
    print("[WARNING] flask-limiter not installed. Rate limiting disabled.")

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
db = client['cse_adaptive_testing']
users_collection = db['users']
tests_collection = db['tests']
questions_collection = db['questions']
cards_collection = db['cards']
notifications_collection = db['notifications']
learning_behavior_collection = db['learning_behavior']
evaluations_collection = db['evaluations']
resumes_collection = db['resumes']
interview_sessions_collection = db['interview_sessions']

# Optional text index creation. Keep it opt-in so app startup does not block
# when MongoDB is offline or DNS is restricted in local development.
if os.getenv('CREATE_QUESTION_TEXT_INDEX', 'false').lower() == 'true':
    try:
        questions_collection.create_index([("question", "text")])
    except Exception as e:
        print(f"[WARNING] Could not create text index for questions: {e}")
# YouTube API
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None

# NPTEL Course Map per subject
NPTEL_COURSE_MAP = {
    'Data Structures': {
        'title': 'Data Structures and Algorithms Using Python',
        'url': 'https://nptel.ac.in/courses/106106145',
        'description': 'Comprehensive coverage of arrays, linked lists, trees, graphs, sorting and searching algorithms by IIT Madras.',
        'duration': '12 Weeks'
    },
    'Algorithm': {
        'title': 'Design and Analysis of Algorithms',
        'url': 'https://nptel.ac.in/courses/106101060',
        'description': 'Greedy methods, dynamic programming, backtracking, branch & bound, and NP-completeness by IIT Bombay.',
        'duration': '8 Weeks'
    },
    'DBMS': {
        'title': 'Database Management System',
        'url': 'https://nptel.ac.in/courses/106104135',
        'description': 'Relational model, SQL, normalization, transactions, query optimization, and NoSQL by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'OS': {
        'title': 'Operating Systems',
        'url': 'https://nptel.ac.in/courses/106105083',
        'description': 'Process management, memory management, file systems, I/O, and synchronization by IIT Bombay.',
        'duration': '8 Weeks'
    },
    'CN': {
        'title': 'Computer Networks and Internet Protocol',
        'url': 'https://nptel.ac.in/courses/106105081',
        'description': 'TCP/IP stack, routing algorithms, transport protocols, and network security by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'DCN': {
        'title': 'Data Communication and Computer Networks',
        'url': 'https://nptel.ac.in/courses/106105082',
        'description': 'Physical layer, data link control, LAN, WAN technologies, and network security protocols.',
        'duration': '10 Weeks'
    },
    'Python': {
        'title': 'Programming, Data Structures and Algorithms Using Python',
        'url': 'https://nptel.ac.in/courses/106106145',
        'description': 'Python programming fundamentals, OOP, data structures and algorithm design by IIT Madras.',
        'duration': '8 Weeks'
    },
    'Java': {
        'title': 'Programming in Java',
        'url': 'https://nptel.ac.in/courses/106105127',
        'description': 'Object-oriented programming with Java, collections, exception handling, and multi-threading by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'ML': {
        'title': 'Introduction to Machine Learning',
        'url': 'https://nptel.ac.in/courses/106106139',
        'description': 'Supervised and unsupervised learning, neural networks, model evaluation by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'Cloud Computing': {
        'title': 'Cloud Computing',
        'url': 'https://nptel.ac.in/courses/106104189',
        'description': 'Cloud architecture, SaaS/PaaS/IaaS, virtualization, and case studies on AWS & GCP by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'IoT': {
        'title': 'Internet of Things',
        'url': 'https://nptel.ac.in/courses/106105166',
        'description': 'IoT architecture, sensor networks, communication protocols, and hands-on project design by IIT Kharagpur.',
        'duration': '8 Weeks'
    },
    'OOP': {
        'title': 'Programming in C++ (OOP)',
        'url': 'https://nptel.ac.in/courses/106105153',
        'description': 'Object-oriented concepts, C++ programming, templates, STL, and design patterns by IIT Bombay.',
        'duration': '8 Weeks'
    },
    'WebTech': {
        'title': 'Web Technologies',
        'url': 'https://nptel.ac.in/courses/106106136',
        'description': 'HTML5, CSS3, JavaScript, PHP, XML, and web application development by IIT Kharagpur.',
        'duration': '12 Weeks'
    },
    'C Programming': {
        'title': 'Programming in C',
        'url': 'https://nptel.ac.in/courses/106102064',
        'description': 'C language fundamentals, pointers, memory management, structures, and file I/O by IIT Bombay.',
        'duration': '8 Weeks'
    },
    'Maths': {
        'title': 'Discrete Mathematics',
        'url': 'https://nptel.ac.in/courses/111106086',
        'description': 'Set theory, graph theory, combinatorics, logic, and proof techniques for CS students by IIT Roorkee.',
        'duration': '8 Weeks'
    },
}

# CSE Subjects
CSE_SUBJECTS = [
    "Cloud Computing",
    "C Programming",
    "AT",
    "Python",
    "Algorithm",
    "CN",
    "CSCL",
    "Data Structures",
    "DBMS",
    "DCN",
    "DMS",
    "DSMP",
    "IoT",
    "Java",
    "Maths",
    "ML",
    "OOP",
    "OS",
    "WebTech",
]


def _fetch_random_question(subject, difficulty, exclude_ids=None):
    """Fetch a random question for the subject/difficulty, avoiding used ids when possible."""
    match_filter = {'difficulty': difficulty}
    if isinstance(subject, list):
        match_filter['subject'] = {'$in': subject}
    else:
        match_filter['subject'] = subject

    if exclude_ids:
        match_filter['_id'] = {'$nin': exclude_ids}

    pipeline = [{'$match': match_filter}, {'$sample': {'size': 1}}]
    question_docs = list(questions_collection.aggregate(pipeline))

    # If all questions already used, allow repeats by removing exclude_ids
    if not question_docs and exclude_ids:
        fallback_filter = {'difficulty': difficulty}
        if isinstance(subject, list):
            fallback_filter['subject'] = {'$in': subject}
        else:
            fallback_filter['subject'] = subject
            
        question_docs = list(questions_collection.aggregate([
            {'$match': fallback_filter},
            {'$sample': {'size': 1}}
        ]))

    return question_docs[0] if question_docs else None


def _question_to_response(question_doc, subject, difficulty):
    """Prepare question payload for API responses."""
    if question_doc:
        return {
            'question_id': str(question_doc['_id']),
            'question': question_doc['question'],
            'options': question_doc['options'],
            'difficulty': question_doc['difficulty'],
            'subject': question_doc['subject'],
        }

    # Fallback sample (should rarely happen if database is populated)
    return {
        'question_id': None,
        'question': f'Sample {difficulty} question for {subject}',
        'options': ['Option A', 'Option B', 'Option C', 'Option D'],
        'difficulty': difficulty,
        'subject': subject[0] if isinstance(subject, list) else subject,
    }


def _collect_used_question_ids(test_questions):
    used_ids = []
    for q in test_questions:
        qid = q.get('question_id')
        if not qid:
            continue
        try:
            used_ids.append(ObjectId(qid))
        except Exception:
            continue
    return used_ids

# Helper function to convert ObjectId to string
def json_serial(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

@app.route('/api/register', methods=['POST'])
def register():
    # Apply rate limit if limiter is available
    if RATE_LIMITING_ENABLED:
        try:
            limiter.limit("10 per hour")(lambda: None)()
        except Exception:
            return jsonify({'error': 'Too many registration attempts. Try again later.'}), 429
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        interests = data.get('interests', [])
        capability_level = data.get('capability_level', 'Beginner')
        
        if not email or not password or not name:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'interests': interests,
            'capability_level': capability_level,
            'created_at': datetime.now(timezone.utc)
        }
        
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
        
        # Create access + refresh tokens
        access_token  = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token':  access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user_id,
                'email': email,
                'name': name,
                'interests': interests,
                'capability_level': capability_level
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    # Apply rate limit if limiter is available
    if RATE_LIMITING_ENABLED:
        try:
            limiter.limit("20 per hour")(lambda: None)()
        except Exception:
            return jsonify({'error': 'Too many login attempts. Try again later.'}), 429
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token  = create_access_token(identity=str(user['_id']))
        refresh_token = create_refresh_token(identity=str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'access_token':  access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'interests': user.get('interests', []),
                'capability_level': user.get('capability_level', 'Beginner')
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects', methods=['GET'])
@jwt_required()
def get_subjects():
    return jsonify({'subjects': CSE_SUBJECTS}), 200


# ── JWT REFRESH TOKEN ─────────────────────────────────────────────────────────
@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_access_token():
    """Issue a fresh access token using a valid refresh token."""
    identity = get_jwt_identity()
    new_token = create_access_token(identity=identity)
    return jsonify({'access_token': new_token}), 200


@app.route('/api/questions/<subject>', methods=['GET'])
@jwt_required()
def get_question(subject):
    try:
        difficulty = request.args.get('difficulty', 'easy')
        question_doc = _fetch_random_question(subject, difficulty)
        payload = _question_to_response(question_doc, subject, difficulty)
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/start', methods=['POST'])
@jwt_required()
def start_test():
    try:
        user_id = get_jwt_identity()
        data = request.json
        subject = data.get('subject')
        
        if not subject:
            return jsonify({'error': 'Subject is required'}), 400

        # Freemium Tier Check Removed - All features are free
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        
        # Create test session
        num_questions = max(5, min(int(data.get('num_questions', 10)), 30))
        starting_difficulty = data.get('starting_difficulty', 'easy')
        if starting_difficulty not in ['easy', 'moderate-1', 'moderate-2', 'hard']:
            starting_difficulty = 'easy'

        test = {
            'user_id': user_id,
            'subject': subject,
            'started_at': datetime.now(timezone.utc),
            'questions': [],
            'current_difficulty': starting_difficulty,
            'status': 'in_progress',
            'config': {
                'num_questions': num_questions,
                'starting_difficulty': starting_difficulty
            }
        }
        
        result = tests_collection.insert_one(test)
        test_id = str(result.inserted_id)
        
        # Get first question
        question_doc = _fetch_random_question(subject, 'easy')
        question_payload = _question_to_response(question_doc, subject, 'easy')
        
        return jsonify({
            'test_id': test_id,
            'num_questions': num_questions,
            'question': {
                'question_id': question_payload['question_id'],
                'question': question_payload['question'],
                'options': question_payload['options'],
                'difficulty': question_payload['difficulty'],
                'subject': question_payload['subject']
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/submit-answer', methods=['POST'])
@jwt_required()
def submit_answer():
    try:
        user_id = get_jwt_identity()
        data = request.json
        test_id = data.get('test_id')
        question_id = data.get('question_id')
        selected_answer = data.get('selected_answer')
        time_taken = data.get('time_taken', 0)
        
        # Get question
        question = None
        if question_id:
            try:
                question = questions_collection.find_one({'_id': ObjectId(question_id)})
            except Exception:
                question = None

        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        # Check if answer is correct
        is_correct = question['correct_answer'] == selected_answer
        
        # Get test
        test = tests_collection.find_one({'_id': ObjectId(test_id), 'user_id': user_id})
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        # Add answer to test
        answer_data = {
            'question_id': question_id,
            'selected_answer': selected_answer,
            'correct_answer': question['correct_answer'],
            'is_correct': is_correct,
            'time_taken': time_taken,
            'difficulty': question['difficulty'],
            'answered_at': datetime.now(timezone.utc)
        }
        
        questions = test.get('questions', [])
        questions.append(answer_data)

        used_question_ids = _collect_used_question_ids(questions)
        
        # Determine next difficulty
        current_difficulty = test.get('current_difficulty', 'easy')

        # SRS SM-2 Update Logic
        card = cards_collection.find_one({'user_id': user_id, 'question_id': question_id})
        if not card:
            card = {'user_id': user_id, 'question_id': question_id, 'reps': 0, 'ease': 2.5, 'interval': 0}
        
        quality = 5 if is_correct and time_taken < 30 else (3 if is_correct else (1 if time_taken > 60 else 0))
        
        if quality >= 3:
            card['reps'] += 1
            if card['reps'] == 1:
                card['interval'] = 1
            elif card['reps'] == 2:
                card['interval'] = 6
            else:
                card['interval'] = int(card['interval'] * card['ease'])
        else:
            card['reps'] = 0
            card['interval'] = 1
            
        card['ease'] = max(1.3, card['ease'] + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        card['next_review'] = datetime.now(timezone.utc) + timedelta(days=card['interval'])
        
        cards_collection.update_one(
            {'user_id': user_id, 'question_id': question_id},
            {'$set': card},
            upsert=True
        )
        difficulty_levels = ['easy', 'moderate-1', 'moderate-2', 'hard']
        current_index = difficulty_levels.index(current_difficulty) if current_difficulty in difficulty_levels else 0
        
        # Adaptive logic: increase if correct and fast, decrease if incorrect or slow
        if is_correct and time_taken < 30:  # Correct and fast
            next_index = min(current_index + 1, len(difficulty_levels) - 1)
        elif not is_correct or time_taken > 60:  # Incorrect or slow
            next_index = max(current_index - 1, 0)
        else:
            next_index = current_index
        
        next_difficulty = difficulty_levels[next_index]
        
        # Update test
        tests_collection.update_one(
            {'_id': ObjectId(test_id)},
            {
                '$set': {
                    'questions': questions,
                    'current_difficulty': next_difficulty
                }
            }
        )
        
        # Get next question (avoid repeats if possible)
        next_question_doc = _fetch_random_question(
            test['subject'],
            next_difficulty,
            exclude_ids=used_question_ids
        )
        next_question_payload = _question_to_response(next_question_doc, test['subject'], next_difficulty)
        
        return jsonify({
            'is_correct': is_correct,
            'next_question': {
                'question_id': next_question_payload['question_id'],
                'question': next_question_payload['question'],
                'options': next_question_payload['options'],
                'difficulty': next_question_payload['difficulty'],
                'subject': next_question_payload['subject']
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/finish', methods=['POST'])
@jwt_required()
def finish_test():
    try:
        user_id = get_jwt_identity()
        data = request.json
        test_id = data.get('test_id')
        
        test = tests_collection.find_one({'_id': ObjectId(test_id), 'user_id': user_id})
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        questions = test.get('questions', [])
        if not questions:
            return jsonify({'error': 'No questions answered'}), 400
        
        # Calculate analytics
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
        
        # Update test
        tests_collection.update_one(
            {'_id': ObjectId(test_id)},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.now(timezone.utc),
                    'analytics': {
                        'accuracy': accuracy,
                        'avg_time': avg_time,
                        'difficulty_progression': difficulty_progression,
                        'capability_score': capability_score,
                        'final_capability_level': final_level,
                        'total_questions': total_questions,
                        'correct_answers': correct_answers
                    }
                }
            }
        )
        
        # Get weak areas (questions answered incorrectly)
        weak_areas = [q['question_id'] for q in questions if not q['is_correct']]

        # Update user study streak
        update_user_streak(user_id)

        return jsonify({
            'test_id': test_id,
            'analytics': {
                'accuracy': accuracy,
                'avg_time': avg_time,
                'difficulty_progression': difficulty_progression,
                'capability_score': capability_score,
                'final_capability_level': final_level,
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'weak_areas': weak_areas
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/practice/question', methods=['GET'])
@jwt_required()
def get_practice_question():
    try:
        subject = request.args.get('subject')
        difficulty = request.args.get('difficulty', 'easy')
        exclude_raw = request.args.get('exclude', '')
        exclude_ids = []
        if exclude_raw:
            exclude_ids = [ObjectId(x) for x in exclude_raw.split(',') if len(x) == 24]

        # Mixed Practice support
        search_subject = list(NPTEL_COURSE_MAP.keys()) if subject == 'Mixed' else subject

        doc = _fetch_random_question(search_subject, difficulty, exclude_ids)
        if not doc:
             # Fallback if strict difficulty fails
             doc = _fetch_random_question(search_subject, 'easy', [])
             
        if not doc:
            return jsonify({'error': 'No questions found'}), 404
            
        payload = _question_to_response(doc, search_subject, difficulty)
        # For practice mode, we need to return the correct_answer so the UI can validate instantly
        payload['correct_answer'] = doc.get('correct_answer')
        
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/terminate', methods=['POST'])
@jwt_required()
def terminate_test():
    try:
        user_id = get_jwt_identity()
        data = request.json
        test_id = data.get('test_id')
        reason = data.get('reason', 'proctoring_violation')

        if not test_id:
            return jsonify({'error': 'test_id is required'}), 400

        test = tests_collection.find_one({'_id': ObjectId(test_id), 'user_id': user_id})
        if not test:
            return jsonify({'error': 'Test not found'}), 404

        if test.get('status') in ['completed', 'terminated']:
            return jsonify({'message': 'Test already ended'}), 200

        questions = test.get('questions', [])
        analytics = {}

        if questions:
            total_questions = len(questions)
            correct_answers = sum(1 for q in questions if q['is_correct'])
            accuracy = (correct_answers / total_questions) * 100
            avg_time = sum(q['time_taken'] for q in questions) / total_questions
            capability_score = (accuracy * 0.6) + ((100 - min(avg_time, 60)) * 0.4)

            if capability_score >= 70:
                final_level = 'Advanced'
            elif capability_score >= 40:
                final_level = 'Intermediate'
            else:
                final_level = 'Beginner'

            analytics = {
                'accuracy': accuracy,
                'avg_time': avg_time,
                'capability_score': capability_score,
                'final_capability_level': final_level,
                'total_questions': total_questions,
                'correct_answers': correct_answers,
                'difficulty_progression': [q['difficulty'] for q in questions],
                'terminated': True,
                'termination_reason': reason
            }

        tests_collection.update_one(
            {'_id': ObjectId(test_id)},
            {
                '$set': {
                    'status': 'terminated',
                    'completed_at': datetime.now(timezone.utc),
                    'termination_reason': reason,
                    'analytics': analytics
                }
            }
        )

        return jsonify({'message': 'Test terminated due to proctoring violation', 'analytics': analytics}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/questions/search', methods=['GET'])
@jwt_required()
def search_questions():
    try:
        q = request.args.get('q', '')
        if not q:
            return jsonify({'results': []}), 200
            
        results = list(questions_collection.find(
            {'$text': {'$search': q}},
            {'score': {'$meta': 'textScore'}}
        ).sort([('score', {'$meta': 'textScore'})]).limit(20))
        
        for r in results:
            r['_id'] = str(r['_id'])
        return jsonify({'results': results}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/test/due-reviews', methods=['GET'])
@jwt_required()
def get_due_reviews():
    try:
        user_id = get_jwt_identity()
        now = datetime.now(timezone.utc)
        due_cards = list(cards_collection.find({
            'user_id': user_id, 
            'next_review': {'$lte': now}
        }).limit(50))
        
        question_ids = [ObjectId(c['question_id']) for c in due_cards if ObjectId.is_valid(c['question_id'])]
        questions = list(questions_collection.find({'_id': {'$in': question_ids}}))
        
        for q in questions:
            q['_id'] = str(q['_id'])
            
        return jsonify({'due_count': len(questions), 'questions': questions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations', methods=['POST'])
@jwt_required()
def get_recommendations():
    try:
        user_id = get_jwt_identity()
        data = request.json
        test_id = data.get('test_id')
        
        test = tests_collection.find_one({'_id': ObjectId(test_id), 'user_id': user_id})
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        analytics = test.get('analytics', {})
        subject = test['subject']
        capability_level = analytics.get('final_capability_level', 'Beginner')
        accuracy = analytics.get('accuracy', 0)
        
        recommendations = {
            'youtube_videos': [],
            'courses': []
        }
        
        # Generate YouTube recommendations
        if youtube:
            keywords = [
                f"{subject} for {capability_level.lower()}",
                f"advanced {subject} tutorial" if capability_level == 'Advanced' else f"{subject} tutorial",
                f"{subject} explained quickly"
            ]
            
            for keyword in keywords:
                try:
                    search_response = youtube.search().list(
                        q=keyword,
                        part='snippet',
                        type='video',
                        maxResults=5,
                        order='relevance'
                    ).execute()
                    
                    for item in search_response.get('items', []):
                        recommendations['youtube_videos'].append({
                            'title': item['snippet']['title'],
                            'description': item['snippet']['description'],
                            'thumbnail': item['snippet']['thumbnails']['default']['url'],
                            'video_id': item['id']['videoId'],
                            'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                        })
                except Exception as e:
                    print(f"YouTube API error: {e}")
        
        # Generate Coursera course recommendations
        recommendations['courses'] = [
            {
                'title': f'{subject} - {capability_level} Level Course',
                'provider': 'Coursera',
                'url': f'https://www.coursera.org/search?query={subject.replace(" ", "%20")}%20{capability_level.lower()}',
                'description': f'Comprehensive {capability_level.lower()} level course on {subject} by top universities and industry experts.'
            },
            {
                'title': f'Master {subject} Specialization',
                'provider': 'Coursera',
                'url': f'https://www.coursera.org/search?query={subject.replace(" ", "%20")}',
                'description': f'Learn {subject} from industry experts with hands-on projects and a shareable certificate.'
            }
        ]

        # NPTEL course recommendations (free, IIT/IISc)
        nptel_data = NPTEL_COURSE_MAP.get(subject)
        if nptel_data:
            recommendations['nptel_courses'] = [
                {
                    'title': nptel_data['title'],
                    'provider': 'NPTEL (IIT/IISc)',
                    'url': nptel_data['url'],
                    'description': nptel_data['description'],
                    'duration': nptel_data.get('duration', 'Self-paced'),
                    'type': 'Free with Optional Certificate'
                }
            ]
        else:
            # Fallback to NPTEL search
            recommendations['nptel_courses'] = [
                {
                    'title': f'{subject} — NPTEL Course',
                    'provider': 'NPTEL (IIT/IISc)',
                    'url': f'https://nptel.ac.in/search?query={subject.replace(" ", "+")}',
                    'description': f'Find free, government-certified {subject} courses taught by IIT and IISc professors.',
                    'duration': 'Varies',
                    'type': 'Free with Optional Certificate'
                }
            ]
        
        return jsonify(recommendations), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── HELPERS: BADGES + STREAK ─────────────────────────────────────────────────
def compute_badges(user_id, tests_list=None, user_doc=None):
    """Return a list of achievement badges earned by the user."""
    if tests_list is None:
        tests_list = list(tests_collection.find({'user_id': user_id}))
    if user_doc is None:
        try:
            user_doc = users_collection.find_one({'_id': ObjectId(user_id)}) or {}
        except Exception:
            user_doc = {}

    completed = [t for t in tests_list if t.get('status') == 'completed']
    scores    = [t.get('analytics', {}).get('capability_score', 0) for t in completed]
    best      = max(scores) if scores else 0
    badges    = []

    if len(completed) >= 1:
        badges.append({'id': 'pioneer',       'name': 'Pioneer',           'icon': '🚀', 'desc': 'Completed your first test'})
    if len(completed) >= 5:
        badges.append({'id': 'consistent',    'name': 'Consistent Learner','icon': '📚', 'desc': 'Completed 5+ tests'})
    if len(completed) >= 10:
        badges.append({'id': 'dedicated',     'name': 'Dedicated Scholar', 'icon': '🎓', 'desc': 'Completed 10+ tests'})
    if len(completed) >= 25:
        badges.append({'id': 'champion',      'name': 'Champion',          'icon': '👑', 'desc': 'Completed 25+ tests'})
    if best >= 70:
        badges.append({'id': 'achiever',      'name': 'High Achiever',     'icon': '🔥', 'desc': 'Scored 70+ in a test'})
    if best >= 85:
        badges.append({'id': 'excellence',    'name': 'Excellence',        'icon': '🏆', 'desc': 'Scored 85+ in a test'})
    if best >= 95:
        badges.append({'id': 'diamond',       'name': 'Diamond',           'icon': '💎', 'desc': 'Scored 95+ in a test'})

    # Subject mastery (3+ completed in one subject)
    subj_counts = {}
    for t in completed:
        s = t.get('subject', '')
        subj_counts[s] = subj_counts.get(s, 0) + 1
    if any(v >= 3 for v in subj_counts.values()):
        badges.append({'id': 'subject_master','name': 'Subject Master',    'icon': '⭐', 'desc': '3+ tests in one subject'})

    # Speed badge: avg_time < 20s AND score >= 70
    fast = [t for t in completed if t.get('analytics', {}).get('avg_time', 999) < 20 and t.get('analytics', {}).get('capability_score', 0) >= 70]
    if fast:
        badges.append({'id': 'speedster',     'name': 'Speedster',         'icon': '⚡', 'desc': 'Fast & accurate!'})

    # Streak badges
    streak = (user_doc or {}).get('streak', 0)
    if streak >= 3:
        badges.append({'id': 'streak_3',      'name': 'On a Roll',         'icon': '🔥', 'desc': '3-day study streak'})
    if streak >= 7:
        badges.append({'id': 'streak_7',      'name': 'Streak Star',       'icon': '🌟', 'desc': '7-day study streak'})
    if streak >= 30:
        badges.append({'id': 'streak_30',     'name': 'Unstoppable',       'icon': '💫', 'desc': '30-day study streak'})

    return badges


def update_user_streak(user_id):
    """Increment or reset the user's daily study streak."""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'streak': 1, 'max_streak': 1, 'last_activity_date': 1})
        if not user:
            return
        today    = datetime.now(timezone.utc).date()
        last_raw = user.get('last_activity_date')
        if last_raw:
            last_date = last_raw.date() if hasattr(last_raw, 'date') else last_raw
            diff      = (today - last_date).days
            if diff == 0:
                return           # already counted today
            elif diff == 1:
                new_streak = user.get('streak', 0) + 1
            else:
                new_streak = 1   # streak broken
        else:
            new_streak = 1

        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'streak':              new_streak,
                'max_streak':          max(new_streak, user.get('max_streak', 0)),
                'last_activity_date':  datetime.now(timezone.utc),
            }}
        )

        # Generate Milestone Notifications automatically
        if new_streak in [3, 7, 30]:
             notifications_collection.insert_one({
                'user_id': user_id,
                'title': f'{new_streak} Day Streak! 🔥',
                'body': f'You are on fire! You have studied for {new_streak} consecutive days.',
                'created_at': datetime.now(timezone.utc),
                'read': False
             })

    except Exception as e:
        print(f'[streak error] {e}')


@app.route('/api/user/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = get_jwt_identity()
        notifs = list(notifications_collection.find({'user_id': user_id}).sort('created_at', -1).limit(20))
        for n in notifs: n['_id'] = str(n['_id'])
        return jsonify({'notifications': notifs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/notifications/clear', methods=['POST'])
@jwt_required()
def clear_notifications():
    try:
        user_id = get_jwt_identity()
        notifications_collection.update_many({'user_id': user_id}, {'$set': {'read': True}})
        return jsonify({'message': 'Ok'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    try:
        user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get all completed tests for this user
        tests = list(tests_collection.find(
            {'user_id': user_id, 'status': 'completed'},
            {'started_at': 1}
        ))

        activity = {}
        total = len(tests)
        for t in tests:
            ts = t.get('started_at')
            if ts:
                if hasattr(ts, 'isoformat'):
                    day_str = ts.isoformat()[:10]
                else:
                    day_str = str(ts)[:10]
                activity[day_str] = activity.get(day_str, 0) + 1

        return jsonify({
            'activity': activity,
            'total_tests': total,
            'streak': user.get('streak', 0),
            'max_streak': user.get('max_streak', 0)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    try:
        user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Fetch last 20 tests sorted newest-first
        all_tests = list(tests_collection.find({'user_id': user_id}).sort('started_at', -1).limit(20))
        completed = [t for t in all_tests if t.get('status') == 'completed']

        # Build test history response
        test_history = []
        for test in all_tests[:12]:
            analytics = test.get('analytics', {})
            ts = test.get('started_at')
            test_history.append({
                'test_id':          str(test['_id']),
                'subject':          test['subject'],
                'started_at':       ts.isoformat() if hasattr(ts, 'isoformat') else str(ts),
                'status':           test.get('status', 'in_progress'),
                'capability_score': round(analytics.get('capability_score', 0), 1),
                'capability_level': analytics.get('final_capability_level', 'N/A'),
                'accuracy':         round(analytics.get('accuracy', 0), 1),
                'total_questions':  analytics.get('total_questions', 0),
                'correct_answers':  analytics.get('correct_answers', 0),
            })

        # Aggregate stats
        scores     = [t.get('analytics', {}).get('capability_score', 0) for t in completed]
        accuracies = [t.get('analytics', {}).get('accuracy', 0)          for t in completed]
        stats = {
            'total_tests':     len(all_tests),
            'completed_tests': len(completed),
            'avg_score':       round(sum(scores)     / len(scores),     1) if scores     else 0,
            'best_score':      round(max(scores),                        1) if scores     else 0,
            'avg_accuracy':    round(sum(accuracies) / len(accuracies),  1) if accuracies else 0,
            'streak':          user.get('streak',     0),
            'max_streak':      user.get('max_streak', 0),
        }

        # Subject-wise best score
        subject_best = {}
        for t in completed:
            subj  = t.get('subject', '')
            score = t.get('analytics', {}).get('capability_score', 0)
            if score > subject_best.get(subj, 0):
                subject_best[subj] = round(score, 1)

        # Score trend: last 10 completed tests in chronological order
        recent_chrono = sorted(
            completed[:15],
            key=lambda t: t.get('completed_at') or t.get('started_at') or datetime.now(timezone.utc)
        )[-10:]
        trend = []
        for t in recent_chrono:
            ts = t.get('completed_at') or t.get('started_at')
            trend.append({
                'date':    ts.isoformat() if hasattr(ts, 'isoformat') else str(ts),
                'score':   round(t.get('analytics', {}).get('capability_score', 0), 1),
                'subject': t.get('subject', ''),
            })

        # Compute badges
        badges = compute_badges(user_id, all_tests, user)

        return jsonify({
            'user': {
                'id':               str(user['_id']),
                'name':             user['name'],
                'email':            user['email'],
                'interests':        user.get('interests', []),
                'capability_level': user.get('capability_level', 'Beginner'),
                'streak':           user.get('streak', 0),
                'max_streak':       user.get('max_streak', 0),
            },
            'test_history': test_history,
            'stats':        stats,
            'subject_best': subject_best,
            'badges':       badges,
            'trend':        trend,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500




# ── LEADERBOARD ────────────────────────────────────────────────────────────────
@app.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Return top 20 users ranked by best capability score (global or per-subject)."""
    try:
        subject = request.args.get('subject')   # optional filter
        period  = request.args.get('period', 'all')  # 'weekly' | 'monthly' | 'all'

        match_filter = {'status': 'completed', 'analytics': {'$exists': True}}

        if subject:
            match_filter['subject'] = subject

        if period == 'weekly':
            from datetime import timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            match_filter['completed_at'] = {'$gte': cutoff}
        elif period == 'monthly':
            from datetime import timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            match_filter['completed_at'] = {'$gte': cutoff}

        pipeline = [
            {'$match': match_filter},
            {'$group': {
                '_id': '$user_id',
                'best_score':   {'$max': '$analytics.capability_score'},
                'avg_score':    {'$avg': '$analytics.capability_score'},
                'tests_taken':  {'$sum': 1},
                'best_subject': {'$first': '$subject'},
                'best_level':   {'$first': '$analytics.final_capability_level'},
            }},
            {'$sort': {'best_score': -1}},
            {'$limit': 20},
        ]

        results = list(tests_collection.aggregate(pipeline))

        # Enrich with user names
        leaderboard = []
        for rank, entry in enumerate(results, start=1):
            uid = entry['_id']
            try:
                u = users_collection.find_one({'_id': ObjectId(uid)}, {'name': 1, 'email': 1})
                name = u['name'] if u else 'Unknown'
            except Exception:
                name = 'Unknown'

            leaderboard.append({
                'rank':        rank,
                'name':        name,
                'best_score':  round(entry['best_score'] or 0, 1),
                'avg_score':   round(entry['avg_score']  or 0, 1),
                'tests_taken': entry['tests_taken'],
                'best_level':  entry.get('best_level', 'N/A'),
            })

        return jsonify({
            'leaderboard': leaderboard,
            'subject':     subject or 'All Subjects',
            'period':      period,
            'total':       len(leaderboard),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Phase 4: AI Features ──────────────────────────────────────────────────

def _safe_openai_call(prompt):
    """Executes an OpenAI call if enabled, else returns a fallback string."""
    if not AI_ENABLED:
        return "⚠️ **AI disabled.** Please configure `OPENAI_API_KEY` in your `.env` file to enable AI insights."
    try:
        response = openai_client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[AI Error] {e}")
        return f"⚠️ **AI Error:** {str(e)}"

@app.route('/api/ai/explain', methods=['POST'])
@jwt_required()
def ai_explain():
    try:
        data = request.json
        q_text   = data.get('question', '')
        options  = data.get('options', [])
        correct  = data.get('correct_answer', '')
        selected = data.get('selected_answer', '')
        
        prompt = (
            f"You are a computer science professor. Explain this question briefly.\n"
            f"Question: {q_text}\n"
            f"Options: {', '.join(options)}\n"
            f"Correct Answer: {correct}\n"
            f"User Selected: {selected}\n\n"
            "Provide a concise, encouraging explanation of why the correct answer is correct and why the user's answer (if wrong) was incorrect. Use Markdown."
        )
        explanation = _safe_openai_call(prompt)
        return jsonify({'explanation': explanation}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/learning/evaluate_text', methods=['POST'])
@jwt_required()
def evaluate_text():
    try:
        user_id = get_jwt_identity()
        data = request.json
        concept = data.get('concept', '')
        explanation = data.get('explanation', '')
        is_audio = data.get('is_audio', False)
        
        prompt = (
            f"You are a strict computer science professor evaluating a student's explanation.\n"
            f"Concept to explain: {concept}\n"
            f"Student's explanation: {explanation}\n\n"
            f"Analyze the depth of understanding, concept clarity, and accuracy. "
            f"Return ONLY a JSON object with 'score' (integer 0-100), 'feedback' (encouraging critique), and 'clarity_metric' (Low/Medium/High)."
        )
        result_text = _safe_openai_call(prompt)
        
        import json
        try:
            # strip backticks if markdown
            clean_text = result_text.replace("```json", "").replace("```", "").strip()
            evaluation = json.loads(clean_text)
        except Exception:
            evaluation = {'score': 50, 'feedback': result_text, 'clarity_metric': 'Medium'}
        
        # Save evaluation to db
        evaluations_collection.insert_one({
            'user_id': user_id,
            'type': 'audio' if is_audio else 'text',
            'concept': concept,
            'explanation': explanation,
            'evaluation': evaluation,
            'timestamp': datetime.now(timezone.utc)
        })
        
        return jsonify(evaluation), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/learning/evaluate_project', methods=['POST'])
@jwt_required()
def evaluate_project():
    try:
        user_id = get_jwt_identity()
        data = request.json
        task_prompt = data.get('task_prompt', '')
        code_submission = data.get('code_submission', '')
        time_taken = data.get('time_taken', 0)
        
        prompt = (
            f"You are a senior engineer reviewing a junior's code submission.\n"
            f"Task: {task_prompt}\n"
            f"Submitted Code:\n```\n{code_submission}\n```\n\n"
            f"Analyze the code structure, logic, and potential runtime errors. "
            f"Return ONLY a JSON object with 'score' (integer 0-100), 'feedback', 'structure_quality' (Good/Average/Poor), and 'errors_found' (list of strings)."
        )
        result_text = _safe_openai_call(prompt)
        
        import json
        try:
            clean_text = result_text.replace("```json", "").replace("```", "").strip()
            evaluation = json.loads(clean_text)
        except Exception:
            evaluation = {'score': 50, 'feedback': result_text, 'structure_quality': 'Average', 'errors_found': []}
            
        evaluations_collection.insert_one({
            'user_id': user_id,
            'type': 'project',
            'task': task_prompt,
            'code': code_submission,
            'evaluation': evaluation,
            'time_taken': time_taken,
            'timestamp': datetime.now(timezone.utc)
        })
        
        return jsonify(evaluation), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/roadmap', methods=['POST'])
@jwt_required()
def ai_roadmap():
    try:
        data = request.json
        weak_areas = data.get('weak_areas', [])
        level      = data.get('level', 'Beginner')
        
        prompt = (
            f"You are an expert technical mentor. A {level} student needs a 4-week study roadmap.\n"
            f"Their weakest topics are: {', '.join(weak_areas) if weak_areas else 'General Computer Science'}.\n"
            "Generate a highly structured Markdown roadmap outlining what they should study each week. "
            "Keep it actionable, brief, and beautifully formatted with bullet points."
        )
        roadmap = _safe_openai_call(prompt)
        return jsonify({'roadmap': roadmap}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    try:
        data = request.json
        message = data.get('message', '')
        history = data.get('history', [])
        
        # Build conversational prompt
        prompt = "You are Vantage, an AI study assistant for computer science students. Keep answers under 4 sentences.\n\n"
        for msg in history[-4:]: # keep last 4 for context limit simplicity
            role = "Student" if msg['role'] == 'user' else "Vantage"
            prompt += f"{role}: {msg['content']}\n"
        prompt += f"Student: {message}\nVantage:"
        
        reply = _safe_openai_call(prompt)
        
        # Track if specifically flagged as doubt
        if data.get('is_doubt', False):
             db['doubts'].insert_one({
                 'user_id': get_jwt_identity(),
                 'question': message,
                 'ai_response': reply,
                 'timestamp': datetime.now(timezone.utc)
             })

        return jsonify({'reply': reply}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/learning/reflection', methods=['POST'])
@jwt_required()
def mistake_reflection():
    try:
        data = request.json
        user_id = get_jwt_identity()
        reflection_text = data.get('reflection', '')
        
        db['reflections'].insert_one({
            'user_id': user_id,
            'reflection': reflection_text,
            'timestamp': datetime.now(timezone.utc)
        })
        return jsonify({'message': 'Reflection saved.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/challenges/daily', methods=['GET'])
@jwt_required()
def daily_challenge():
    try:
        import random
        seed = datetime.now().timetuple().tm_yday
        random.seed(seed)
        scenarios = [
            {"id": "c1", "title": "The Memory Leak Mystery", "desc": "You are a Senior Engineer at Google. A fresh release caused memory usage to spike. Explain how you would find the leak.", "xp": 150},
            {"id": "c2", "title": "The SQL Injection Incident", "desc": "Hackers are trying to dump your user table. Write a secure parameterized query.", "xp": 200},
            {"id": "c3", "title": "The Thread Deadlock", "desc": "Your payment processing service froze. Identify where thread A blocks thread B.", "xp": 300}
        ]
        
        daily = random.choice(scenarios)
        return jsonify({'challenge': daily}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/learning/dna', methods=['GET'])
@jwt_required()
def learning_dna():
    try:
        user_id = get_jwt_identity()
        
        # 1. Fetch raw behaviors
        behaviors = list(learning_behavior_collection.find({'user_id': user_id}))
        doubts = list(db['doubts'].find({'user_id': user_id}))
        reflections = list(db['reflections'].find({'user_id': user_id}))
        evaluations = list(evaluations_collection.find({'user_id': user_id}))
        
        # Heuristics for psychometric traits
        total_time = sum(b.get('time_spent', 0) for b in behaviors)
        avg_depth = sum(b.get('max_scroll_depth', 0) for b in behaviors) / max(1, len(behaviors))
        
        patience = min(100, int((total_time / max(1, len(behaviors))) / 1000) * 10 + avg_depth * 0.5)
        curiosity = min(100, len(doubts) * 15 + 40)
        awareness = min(100, len(reflections) * 20 + 30)
        
        if evaluations:
            comprehension = sum(e.get('evaluation', {}).get('score', 50) for e in evaluations) / len(evaluations)
        else:
            comprehension = 60
            
        # Top struggled concepts mock + dynamic extraction
        weak_topics = list(set([d.get('question', '').split(' ')[-1] for d in doubts] + ["Trees", "DP"]))[:3]
        strong_topics = ["OOP", "Arrays"]
        
        traits = [
            {"subject": "Patience", "value": round(patience)},
            {"subject": "Curiosity", "value": round(curiosity)},
            {"subject": "Awareness", "value": round(awareness)},
            {"subject": "Comprehension", "value": round(comprehension)},
            {"subject": "Consistency", "value": 85}
        ]
        
        return jsonify({
            'traits': traits,
            'weak_topics': weak_topics,
            'strong_topics': strong_topics,
            'metrics': {
                'total_doubts': len(doubts),
                'total_reflections': len(reflections),
                'avg_eval_score': round(comprehension, 1)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/behavior', methods=['POST'])
@jwt_required()
def track_behavior():
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        behavior_doc = {
            'user_id': user_id,
            'path': data.get('path', ''),
            'time_spent': data.get('timeSpent', 0),
            'max_scroll_depth': data.get('maxScrollDepth', 0),
            'action': data.get('action', 'page_view'),
            'topic': data.get('topic', ''),
            'is_revision': data.get('isRevision', False),
            'timestamp': datetime.now(timezone.utc)
        }
        
        learning_behavior_collection.insert_one(behavior_doc)
        return jsonify({'message': 'Behavior tracked successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── RESUME ANALYSER & AI MOCK INTERVIEW ──────────────────────────────────────

TECH_SKILL_PATTERNS = {
    'Python': [r'\bpython\b'],
    'JavaScript': [r'\bjavascript\b', r'\bjs\b'],
    'TypeScript': [r'\btypescript\b', r'\bts\b'],
    'React': [r'\breact\b', r'\breactjs\b'],
    'Node.js': [r'\bnode\.?js\b', r'\bnode\b'],
    'Express.js': [r'\bexpress\.?js\b'],
    'HTML': [r'\bhtml5?\b'],
    'CSS': [r'\bcss3?\b'],
    'Java': [r'\bjava\b'],
    'C Programming': [r'\bc programming\b', r'\bc language\b'],
    'C++': [r'\bc\+\+\b', r'\bcpp\b'],
    'SQL': [r'\bsql\b', r'\bmysql\b', r'\bpostgresql\b', r'\bpostgres\b'],
    'MongoDB': [r'\bmongodb\b', r'\bmongo\b'],
    'DBMS': [r'\bdbms\b', r'\bdatabase management\b'],
    'Machine Learning': [r'\bmachine learning\b', r'\bml\b'],
    'Deep Learning': [r'\bdeep learning\b', r'\bneural network'],
    'Data Structures': [r'\bdata structures?\b', r'\bdsa\b'],
    'Algorithms': [r'\balgorithms?\b', r'\bdsa\b'],
    'Git': [r'\bgit\b', r'\bgithub\b'],
    'Docker': [r'\bdocker\b', r'\bcontainer'],
    'AWS': [r'\baws\b', r'\bamazon web services\b'],
    'Cloud Computing': [r'\bcloud computing\b', r'\bcloud\b'],
    'REST APIs': [r'\brest\b', r'\bapi\b', r'\bapis\b'],
    'Flask': [r'\bflask\b'],
    'Django': [r'\bdjango\b'],
    'Pandas': [r'\bpandas\b'],
    'NumPy': [r'\bnumpy\b'],
    'Power BI': [r'\bpower bi\b', r'\bpowerbi\b'],
    'Tableau': [r'\btableau\b'],
    'Excel': [r'\bexcel\b'],
    'Testing': [r'\btesting\b', r'\bunit tests?\b', r'\bjest\b', r'\bpytest\b'],
}

SOFT_SKILL_PATTERNS = {
    'Communication': [r'\bcommunication\b', r'\bpresentation\b', r'\bpublic speaking\b'],
    'Teamwork': [r'\bteamwork\b', r'\bcollaboration\b', r'\bcollaborated\b'],
    'Leadership': [r'\bleadership\b', r'\bled\b', r'\bmanaged\b', r'\bmentored\b'],
    'Problem Solving': [r'\bproblem solving\b', r'\banalytical\b', r'\btroubleshooting\b'],
    'Time Management': [r'\btime management\b', r'\bdeadline\b', r'\bprioritized\b'],
    'Adaptability': [r'\badaptability\b', r'\badapted\b', r'\blearned quickly\b'],
}

ROLE_GAP_MAP = {
    'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Testing'],
    'Backend Developer': ['Python', 'Node.js', 'REST APIs', 'SQL', 'MongoDB', 'Docker'],
    'Full Stack Developer': ['React', 'Node.js', 'REST APIs', 'SQL', 'Git', 'Testing'],
    'Data Analyst': ['SQL', 'Python', 'Pandas', 'Excel', 'Power BI', 'Statistics'],
    'Machine Learning Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'Pandas', 'Algorithms'],
    'Cloud/DevOps Engineer': ['Linux', 'Docker', 'AWS', 'Cloud Computing', 'Git', 'CI/CD'],
    'Software Developer': ['Data Structures', 'Algorithms', 'Git', 'SQL', 'Testing', 'System Design'],
}

DOC_RESOURCE_MAP = {
    'Python': ('Python Official Documentation', 'https://docs.python.org/3/tutorial/'),
    'JavaScript': ('MDN JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'),
    'TypeScript': ('TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html'),
    'React': ('React Documentation', 'https://react.dev/learn'),
    'Node.js': ('Node.js Guides', 'https://nodejs.org/en/learn'),
    'HTML': ('MDN HTML Guide', 'https://developer.mozilla.org/en-US/docs/Learn/HTML'),
    'CSS': ('MDN CSS Guide', 'https://developer.mozilla.org/en-US/docs/Learn/CSS'),
    'SQL': ('SQLBolt Interactive Lessons', 'https://sqlbolt.com/'),
    'MongoDB': ('MongoDB University', 'https://learn.mongodb.com/'),
    'Docker': ('Docker Getting Started', 'https://docs.docker.com/get-started/'),
    'AWS': ('AWS Skill Builder', 'https://skillbuilder.aws/'),
    'Git': ('Git Book', 'https://git-scm.com/book/en/v2'),
    'REST APIs': ('REST API Tutorial', 'https://restfulapi.net/'),
    'Machine Learning': ('Google Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course'),
    'Data Structures': ('VisuAlgo Data Structures', 'https://visualgo.net/en'),
    'Algorithms': ('VisuAlgo Algorithms', 'https://visualgo.net/en'),
    'Communication': ('Google Technical Writing', 'https://developers.google.com/tech-writing'),
    'Leadership': ('MindTools Leadership Skills', 'https://www.mindtools.com/a4oo78h/leadership-skills'),
    'Teamwork': ('Atlassian Teamwork Guide', 'https://www.atlassian.com/team-playbook'),
}


def _unique_keep_order(items):
    seen = set()
    result = []
    for item in items:
        if not item:
            continue
        key = str(item).strip().lower()
        if key and key not in seen:
            seen.add(key)
            result.append(str(item).strip())
    return result


def _detect_skills(text, pattern_map):
    found = []
    for skill, patterns in pattern_map.items():
        if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns):
            found.append(skill)
    return found


def _gap_object(skill, severity='Medium', reason=''):
    return {
        'skill': skill,
        'severity': severity,
        'reason': reason or f'{skill} is useful for the roles suggested by this resume.'
    }


def _gap_names(gaps):
    return _unique_keep_order([
        gap.get('skill', '') if isinstance(gap, dict) else gap
        for gap in (gaps or [])
    ])


def _extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else ''


def _extract_candidate_name(text):
    for line in text.splitlines()[:8]:
        clean = re.sub(r'[^A-Za-z .-]', '', line).strip()
        words = clean.split()
        if 2 <= len(words) <= 4 and not any(w.lower() in {'resume', 'curriculum', 'vitae'} for w in words):
            return clean
    return 'Candidate'


def _infer_target_roles(skills, text):
    skill_set = {s.lower() for s in skills}
    lower_text = text.lower()
    roles = []
    if {'react', 'javascript', 'html', 'css'} & skill_set:
        roles.append('Frontend Developer')
    if {'node.js', 'flask', 'django', 'rest apis', 'mongodb', 'sql'} & skill_set:
        roles.append('Backend Developer')
    if {'react', 'node.js'} <= skill_set or 'full stack' in lower_text:
        roles.insert(0, 'Full Stack Developer')
    if {'pandas', 'power bi', 'tableau', 'excel'} & skill_set:
        roles.append('Data Analyst')
    if {'machine learning', 'deep learning', 'numpy'} & skill_set:
        roles.append('Machine Learning Engineer')
    if {'docker', 'aws', 'cloud computing'} & skill_set:
        roles.append('Cloud/DevOps Engineer')
    roles.append('Software Developer')
    return _unique_keep_order(roles)[:3]


def _technical_gaps_for_roles(roles, skills):
    known = {s.lower() for s in skills}
    gaps = []
    for role in roles or ['Software Developer']:
        for skill in ROLE_GAP_MAP.get(role, ROLE_GAP_MAP['Software Developer']):
            if skill.lower() not in known:
                severity = 'High' if len(gaps) < 2 else 'Medium'
                gaps.append(_gap_object(skill, severity, f'{skill} is commonly expected for {role} roles.'))
            if len(gaps) >= 6:
                return gaps
    return gaps


def _soft_skill_gaps(soft_skills):
    known = {s.lower() for s in soft_skills}
    desired = [
        ('Communication', 'High', 'Interviewers expect clear explanation of projects, decisions, and tradeoffs.'),
        ('Problem Solving', 'High', 'Strong resumes should show how you handled ambiguous technical problems.'),
        ('Teamwork', 'Medium', 'Most roles need collaboration evidence from projects, internships, or teams.'),
        ('Leadership', 'Medium', 'Leadership examples help you stand out for ownership and initiative.'),
    ]
    return [_gap_object(skill, severity, reason) for skill, severity, reason in desired if skill.lower() not in known][:4]


def _recommended_courses(technical_gaps, soft_gaps):
    courses = []
    for gap in technical_gaps[:4]:
        skill = gap.get('skill', gap) if isinstance(gap, dict) else gap
        courses.append({
            'skill': skill,
            'type': 'Technical',
            'priority': gap.get('severity', 'Medium') if isinstance(gap, dict) else 'Medium',
            'title': f'{skill} Career Track',
            'provider': 'Coursera / NPTEL / Official Docs',
            'url': f'https://www.coursera.org/search?query={quote_plus(skill)}',
            'description': f'Start with fundamentals, build one mini project, then add {skill} to your resume with proof.'
        })
    for gap in soft_gaps[:3]:
        skill = gap.get('skill', gap) if isinstance(gap, dict) else gap
        courses.append({
            'skill': skill,
            'type': 'Soft Skill',
            'priority': gap.get('severity', 'Medium') if isinstance(gap, dict) else 'Medium',
            'title': f'{skill} for Interviews and Teamwork',
            'provider': 'LinkedIn Learning / Coursera / Practice',
            'url': f'https://www.coursera.org/search?query={quote_plus(skill)}',
            'description': f'Practice {skill.lower()} with STAR stories, mock interviews, and project retrospectives.'
        })
    return courses


def _fallback_resume_analysis(resume_text):
    skills = _detect_skills(resume_text, TECH_SKILL_PATTERNS)
    soft_skills = _detect_skills(resume_text, SOFT_SKILL_PATTERNS)
    roles = _infer_target_roles(skills, resume_text)
    skill_gaps = _technical_gaps_for_roles(roles, skills)
    soft_gaps = _soft_skill_gaps(soft_skills)

    word_count = len(re.findall(r'\w+', resume_text))
    has_metrics = bool(re.search(r'\b\d+%|\b\d+\+|\b\d+x\b', resume_text, flags=re.IGNORECASE))
    has_projects = bool(re.search(r'\b(project|internship|experience|built|developed|implemented)\b', resume_text, flags=re.IGNORECASE))
    content_score = 75 if word_count > 450 else 60 if word_count > 220 else 45
    skills_score = min(90, 35 + len(skills) * 7)
    experience_score = 75 if has_projects else 50
    presentation_score = 78 if has_metrics else 62
    resume_score = round((content_score + skills_score + experience_score + presentation_score) / 4)

    return {
        'name': _extract_candidate_name(resume_text),
        'email': _extract_email(resume_text),
        'summary': 'Resume parsed successfully. The recommendations below are based on detected skills, target roles, missing technical areas, and soft-skill signals.',
        'skills': skills,
        'soft_skills': soft_skills,
        'strong_skills': skills[:3],
        'skill_gaps': skill_gaps,
        'soft_skill_gaps': soft_gaps,
        'education': [],
        'experience': [],
        'resume_score': resume_score,
        'score_breakdown': {
            'content': content_score,
            'skills': skills_score,
            'experience': experience_score,
            'presentation': presentation_score
        },
        'top_improvements': [
            'Add measurable outcomes for projects, internships, or achievements.',
            'Show proof for the highest-priority technical gaps through one focused project.',
            'Add 2-3 interview stories that demonstrate communication, teamwork, and problem solving.'
        ],
        'target_roles': roles,
        'recommended_courses': _recommended_courses(skill_gaps, soft_gaps),
        'learning_path': [
            {'week': 1, 'focus': 'Core gap review', 'goals': _gap_names(skill_gaps[:2])},
            {'week': 2, 'focus': 'Hands-on project', 'goals': ['Build a small project using the top missing skill']},
            {'week': 3, 'focus': 'Soft-skill proof', 'goals': _gap_names(soft_gaps[:2])},
            {'week': 4, 'focus': 'Interview practice', 'goals': ['Mock technical interview', 'Project deep-dive practice']},
        ]
    }


def _normalise_resume_analysis(analysis, resume_text):
    fallback = _fallback_resume_analysis(resume_text)
    if not isinstance(analysis, dict):
        return fallback

    merged = {**fallback, **analysis}
    merged['skills'] = _unique_keep_order(merged.get('skills') or fallback['skills'])
    merged['soft_skills'] = _unique_keep_order(merged.get('soft_skills') or fallback['soft_skills'])
    merged['strong_skills'] = _unique_keep_order(merged.get('strong_skills') or merged['skills'][:3])[:3]
    merged['target_roles'] = _unique_keep_order(merged.get('target_roles') or fallback['target_roles'])[:3]

    if not merged.get('skill_gaps'):
        merged['skill_gaps'] = _technical_gaps_for_roles(merged['target_roles'], merged['skills'])
    if not merged.get('soft_skill_gaps'):
        merged['soft_skill_gaps'] = _soft_skill_gaps(merged['soft_skills'])
    if not merged.get('recommended_courses'):
        merged['recommended_courses'] = _recommended_courses(merged['skill_gaps'], merged['soft_skill_gaps'])
    if not merged.get('learning_path'):
        merged['learning_path'] = fallback['learning_path']

    return merged


def _extract_resume_text(file_storage):
    """Extract plain text from an uploaded PDF or DOCX file."""
    filename = file_storage.filename.lower()
    raw_bytes = file_storage.read()

    if filename.endswith('.pdf'):
        import io
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return '\n'.join(text_parts)

    elif filename.endswith('.docx'):
        import io
        from docx import Document
        doc = Document(io.BytesIO(raw_bytes))
        return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())

    else:
        return ''


def _analyse_resume_with_ai(resume_text):
    """Call GPT to produce a structured JSON analysis of the resume."""
    prompt = (
        "You are a senior technical recruiter and career coach. Analyse the following resume "
        "and return ONLY a JSON object with these exact keys:\n"
        "- 'name': candidate's full name (string)\n"
        "- 'email': email if found else empty string\n"
        "- 'summary': 2-sentence professional summary (string)\n"
        "- 'skills': list of technical skills found (list of strings)\n"
        "- 'soft_skills': list of soft skills found or strongly implied (list of strings)\n"
        "- 'strong_skills': top 3 strongest skills based on experience/projects (list of strings)\n"
        "- 'skill_gaps': list of important technical skills NOT found but relevant to their field "
        "(provide 4-6 gaps with severity: [{\"skill\": str, \"severity\": \"High|Medium|Low\", "
        "\"reason\": str}])\n"
        "- 'soft_skill_gaps': list of soft skills to improve for interviews/career readiness "
        "(provide 3-4 gaps with severity: [{\"skill\": str, \"severity\": \"High|Medium|Low\", "
        "\"reason\": str}])\n"
        "- 'education': list of education entries [{\"degree\": str, \"institution\": str, \"year\": str}]\n"
        "- 'experience': list of work/project experience [{\"role\": str, \"company\": str, "
        "\"duration\": str, \"highlights\": [str]}]\n"
        "- 'resume_score': integer 0-100 overall resume strength\n"
        "- 'score_breakdown': {\"content\": int, \"skills\": int, \"experience\": int, \"presentation\": int}\n"
        "- 'top_improvements': list of 3 actionable improvement tips (list of strings)\n"
        "- 'target_roles': list of 3 suitable job roles based on this resume (list of strings)\n"
        "- 'recommended_courses': list of 5 courses/learning items covering both technical and soft skills "
        "[{\"skill\": str, \"type\": \"Technical|Soft Skill\", \"priority\": \"High|Medium|Low\", "
        "\"title\": str, \"provider\": str, \"url\": str, \"description\": str}]\n"
        "- 'learning_path': list of 4 weekly plan entries "
        "[{\"week\": int, \"focus\": str, \"goals\": [str]}]\n\n"
        f"Resume:\n{resume_text[:4000]}\n\n"
        "Return ONLY valid JSON, no markdown fences."
    )
    result = _safe_openai_call(prompt)
    try:
        clean = result.replace('```json', '').replace('```', '').strip()
        return _normalise_resume_analysis(json.loads(clean), resume_text)
    except Exception:
        return _fallback_resume_analysis(resume_text)


@app.route('/api/resume/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    """Accept a PDF/DOCX resume, extract text, run GPT analysis, store in DB."""
    try:
        user_id = get_jwt_identity()

        if 'resume' not in request.files:
            return jsonify({'error': 'No file uploaded. Use field name "resume".'}), 400

        file = request.files['resume']
        if not file.filename:
            return jsonify({'error': 'Empty filename'}), 400

        allowed = ('.pdf', '.docx')
        if not file.filename.lower().endswith(allowed):
            return jsonify({'error': 'Only PDF and DOCX files are supported.'}), 400

        # Extract text
        resume_text = _extract_resume_text(file)
        if not resume_text or len(resume_text.strip()) < 50:
            return jsonify({'error': 'Could not extract text from the file. Please ensure it is not a scanned image.'}), 422

        # GPT analysis
        analysis = _analyse_resume_with_ai(resume_text)

        # Persist in MongoDB (replace previous upload for this user)
        resumes_collection.update_one(
            {'user_id': user_id},
            {'$set': {
                'user_id': user_id,
                'filename': file.filename,
                'resume_text': resume_text[:8000],
                'analysis': analysis,
                'uploaded_at': datetime.now(timezone.utc)
            }},
            upsert=True
        )

        return jsonify({'message': 'Resume analysed successfully', 'analysis': analysis}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resume/analysis', methods=['GET'])
@jwt_required()
def get_resume_analysis():
    """Return the latest stored resume analysis for the logged-in user."""
    try:
        user_id = get_jwt_identity()
        doc = resumes_collection.find_one({'user_id': user_id}, {'_id': 0, 'resume_text': 0})
        if not doc:
            return jsonify({'error': 'No resume uploaded yet.'}), 404
        return jsonify(doc), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resume/resources', methods=['POST'])
@jwt_required()
def resume_resources():
    """Generate personalised learning resources based on resume skill gaps."""
    try:
        user_id = get_jwt_identity()
        data = request.json or {}

        # Allow passing explicit gaps, or fall back to DB
        skill_gaps = data.get('skill_gaps', [])
        soft_skill_gaps = data.get('soft_skill_gaps', [])
        skills = data.get('skills', [])
        recommended_courses = data.get('recommended_courses', [])
        if not skill_gaps:
            doc = resumes_collection.find_one({'user_id': user_id})
            if doc:
                analysis = doc.get('analysis', {})
                skill_gaps = analysis.get('skill_gaps', [])
                soft_skill_gaps = analysis.get('soft_skill_gaps', [])
                skills = analysis.get('skills', [])
                recommended_courses = analysis.get('recommended_courses', [])

        technical_gap_names = _gap_names(skill_gaps[:6])
        soft_gap_names = _gap_names(soft_skill_gaps[:4])
        gap_names = _unique_keep_order(technical_gap_names + soft_gap_names)
        if not gap_names:
            gap_names = _unique_keep_order(skills[:4] + ['Communication', 'Problem Solving'])

        resources = {
            'videos': [],
            'docs': [],
            'courses': [],
            'youtube': [],
            'nptel': [],
            'coursera': [],
            'soft_skills': []
        }

        # YouTube videos for each gap skill. If the API is not configured,
        # return useful search links so the UI still has video suggestions.
        for skill in gap_names[:5]:
            if youtube:
                try:
                    resp = youtube.search().list(
                        q=f'{skill} tutorial for beginners',
                        part='snippet', type='video',
                        maxResults=2, order='relevance'
                    ).execute()
                    for item in resp.get('items', []):
                        resources['youtube'].append({
                            'skill': skill,
                            'title': item['snippet']['title'],
                            'channel': item['snippet']['channelTitle'],
                            'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                            'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                        })
                        resources['videos'].append({
                            'skill': skill,
                            'title': item['snippet']['title'],
                            'provider': item['snippet']['channelTitle'],
                            'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                            'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                            'type': 'Video'
                        })
                except Exception:
                    pass
            else:
                search_url = f'https://www.youtube.com/results?search_query={quote_plus(skill + " tutorial for beginners")}'
                entry = {
                    'skill': skill,
                    'title': f'YouTube tutorials for {skill}',
                    'channel': 'YouTube Search',
                    'provider': 'YouTube',
                    'thumbnail': '',
                    'url': search_url,
                    'type': 'Video Search'
                }
                resources['youtube'].append(entry)
                resources['videos'].append(entry)

        # Documentation and practical reading links.
        for skill in gap_names[:8]:
            title, url = DOC_RESOURCE_MAP.get(
                skill,
                (f'{skill} documentation and guide', f'https://www.google.com/search?q={quote_plus(skill + " documentation tutorial")}')
            )
            resources['docs'].append({
                'skill': skill,
                'title': title,
                'provider': 'Official Docs / Guide',
                'url': url,
                'description': f'Read and practice the core concepts for {skill}.',
                'type': 'Documentation'
            })

        # NPTEL courses matched to gaps
        for skill in technical_gap_names:
            for nptel_key, nptel_data in NPTEL_COURSE_MAP.items():
                if skill.lower() in nptel_key.lower() or nptel_key.lower() in skill.lower():
                    course = {
                        'skill': skill,
                        'title': nptel_data['title'],
                        'provider': 'NPTEL (IIT/IISc)',
                        'url': nptel_data['url'],
                        'description': nptel_data['description'],
                        'duration': nptel_data.get('duration', 'Self-paced'),
                        'type': 'Free with Optional Certificate'
                    }
                    resources['nptel'].append(course)
                    resources['courses'].append({**course, 'category': 'Technical'})
                    break

        # Coursera for each gap
        for skill in gap_names:
            resources['coursera'].append({
                'skill': skill,
                'title': f'Master {skill} — Coursera Specialization',
                'provider': 'Coursera',
                'url': f'https://www.coursera.org/search?query={skill.replace(" ", "%20")}',
                'description': f'Industry-recognized {skill} courses from top universities and companies.'
            })
            resources['coursera'][-1]['type'] = 'Soft Skill' if skill in soft_gap_names else 'Technical'
            resources['coursera'][-1]['category'] = resources['coursera'][-1]['type']
            resources['courses'].append(resources['coursera'][-1])

        for course in recommended_courses:
            if not isinstance(course, dict):
                continue
            resources['courses'].append({
                'skill': course.get('skill', 'Career skill'),
                'title': course.get('title', 'Recommended course'),
                'provider': course.get('provider', 'Recommended'),
                'url': course.get('url') or f"https://www.coursera.org/search?query={quote_plus(course.get('skill', 'career skills'))}",
                'description': course.get('description', ''),
                'type': course.get('type', 'Technical'),
                'category': course.get('type', 'Technical'),
                'priority': course.get('priority', 'Medium')
            })

        for skill in soft_gap_names:
            resources['soft_skills'].append({
                'skill': skill,
                'title': f'Practice {skill} for interviews',
                'provider': 'Mock Interview Practice',
                'url': f'https://www.coursera.org/search?query={quote_plus(skill)}',
                'description': f'Use STAR stories, project retrospectives, and mock answers to improve {skill.lower()}.',
                'type': 'Soft Skill'
            })

        seen_courses = set()
        unique_courses = []
        for course in resources['courses']:
            key = (course.get('title', '').lower(), course.get('url', '').lower())
            if key not in seen_courses:
                seen_courses.add(key)
                unique_courses.append(course)
        resources['courses'] = unique_courses[:12]

        return jsonify({
            'resources': resources,
            'gap_skills': gap_names,
            'technical_gap_skills': technical_gap_names,
            'soft_gap_skills': soft_gap_names
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resume/interview/start', methods=['POST'])
@jwt_required()
def interview_start():
    """Create a 5-question mock interview session from resume context."""
    try:
        user_id = get_jwt_identity()

        # Load resume analysis from DB
        resume_doc = resumes_collection.find_one({'user_id': user_id})
        if not resume_doc:
            return jsonify({'error': 'Please upload your resume first.'}), 404

        analysis = resume_doc.get('analysis', {})
        skills = ', '.join(analysis.get('skills', [])[:8])
        soft_skills = ', '.join(analysis.get('soft_skills', [])[:5])
        skill_gaps = ', '.join(_gap_names(analysis.get('skill_gaps', [])[:4]))
        soft_gaps = ', '.join(_gap_names(analysis.get('soft_skill_gaps', [])[:3]))
        experience = analysis.get('experience', [])
        exp_text = '; '.join(
            f"{e.get('role','')} at {e.get('company','')}" for e in experience[:3]
        )
        target_roles = ', '.join(analysis.get('target_roles', ['Software Developer']))

        # Ask GPT to generate 5 interview questions
        prompt = (
            f"You are a technical interviewer. Generate exactly 5 interview questions for a candidate "
            f"applying for: {target_roles}.\n"
            f"Their skills include: {skills}.\n"
            f"Their soft skills include: {soft_skills or 'not clearly listed'}.\n"
            f"Their technical gaps are: {skill_gaps or 'general fundamentals'}.\n"
            f"Their soft-skill gaps are: {soft_gaps or 'communication and problem solving'}.\n"
            f"Their experience: {exp_text}.\n\n"
            "The 5 questions must follow this mix:\n"
            "- Q1: Technical concept question (based on their top skill)\n"
            "- Q2: Problem-solving / DSA question\n"
            "- Q3: Project deep-dive (based on their experience)\n"
            "- Q4: System design or architecture question\n"
            "- Q5: Behavioural / situational question\n\n"
            "Return ONLY a JSON array of 5 objects: "
            "[{\"id\": 1, \"type\": str, \"question\": str, \"hint\": str}, ...]"
        )
        result = _safe_openai_call(prompt)
        try:
            clean = result.replace('```json', '').replace('```', '').strip()
            questions = json.loads(clean)
        except Exception:
            strongest_skill = (analysis.get('strong_skills') or analysis.get('skills') or ['OOP'])[0]
            gap_skill = (_gap_names(analysis.get('skill_gaps', [])) or ['Data Structures'])[0]
            questions = [
                {"id": 1, "type": "Technical", "question": f"Explain how {strongest_skill} works and where you used it.", "hint": "Focus on core concepts and a resume-based example."},
                {"id": 2, "type": "DSA", "question": f"How would you strengthen your {gap_skill} fundamentals for coding interviews?", "hint": "Mention concepts, practice plan, and complexity."},
                {"id": 3, "type": "Project", "question": "Walk me through your most complex project.", "hint": "Mention challenges and your role."},
                {"id": 4, "type": "Design", "question": "Design a URL shortener like bit.ly.", "hint": "Consider scale, storage, and hashing."},
                {"id": 5, "type": "Behavioural", "question": "Tell me about a time you resolved a conflict in a team.", "hint": "Use the STAR method."},
            ]

        # Create session in DB
        session_doc = {
            'user_id': user_id,
            'questions': questions,
            'answers': [],
            'feedbacks': [],
            'status': 'in_progress',
            'started_at': datetime.now(timezone.utc)
        }
        result_ins = interview_sessions_collection.insert_one(session_doc)
        session_id = str(result_ins.inserted_id)

        return jsonify({
            'session_id': session_id,
            'total_questions': len(questions),
            'current_question': questions[0],
            'question_index': 0
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resume/interview/respond', methods=['POST'])
@jwt_required()
def interview_respond():
    """Accept student answer, return AI feedback + next question (or done signal)."""
    try:
        user_id = get_jwt_identity()
        data = request.json or {}
        session_id = data.get('session_id')
        answer = data.get('answer', '')
        question_index = data.get('question_index', 0)

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        session = interview_sessions_collection.find_one(
            {'_id': ObjectId(session_id), 'user_id': user_id}
        )
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        questions = session.get('questions', [])
        if question_index >= len(questions):
            return jsonify({'error': 'Invalid question index'}), 400

        current_q = questions[question_index]

        # GPT feedback on this answer
        feedback_prompt = (
            f"You are a technical interviewer. Evaluate this interview answer.\n"
            f"Question ({current_q.get('type','Technical')}): {current_q.get('question','')}\n"
            f"Candidate's Answer: {answer}\n\n"
            "Return ONLY a JSON object with:\n"
            "- 'score': integer 0-10\n"
            "- 'verdict': 'Excellent' | 'Good' | 'Average' | 'Needs Improvement'\n"
            "- 'feedback': 2-3 sentence encouraging evaluation\n"
            "- 'ideal_points': list of 2-3 key points a great answer would include\n"
        )
        fb_result = _safe_openai_call(feedback_prompt)
        try:
            clean = fb_result.replace('```json', '').replace('```', '').strip()
            feedback = json.loads(clean)
        except Exception:
            feedback = {'score': 5, 'verdict': 'Average', 'feedback': fb_result[:300], 'ideal_points': []}

        # Update session
        answers = session.get('answers', [])
        feedbacks = session.get('feedbacks', [])
        answers.append({'question_index': question_index, 'answer': answer})
        feedbacks.append({'question_index': question_index, 'feedback': feedback})

        next_index = question_index + 1
        is_done = next_index >= len(questions)

        update_data = {
            'answers': answers,
            'feedbacks': feedbacks,
        }
        if is_done:
            update_data['status'] = 'completed'
            update_data['completed_at'] = datetime.now(timezone.utc)

        interview_sessions_collection.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': update_data}
        )

        response = {
            'feedback': feedback,
            'question_index': question_index,
            'is_done': is_done
        }
        if not is_done:
            response['next_question'] = questions[next_index]
            response['next_index'] = next_index

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/resume/interview/summary', methods=['GET'])
@jwt_required()
def interview_summary():
    """Return final score, per-question breakdown, and a hiring recommendation."""
    try:
        user_id = get_jwt_identity()
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({'error': 'session_id query param required'}), 400

        session = interview_sessions_collection.find_one(
            {'_id': ObjectId(session_id), 'user_id': user_id}
        )
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        feedbacks = session.get('feedbacks', [])
        questions = session.get('questions', [])

        scores = [f['feedback'].get('score', 5) for f in feedbacks]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        final_score = round(avg_score * 10)  # 0-100

        if final_score >= 80:
            verdict = 'Strong Hire ✅'
            verdict_color = '#16a34a'
        elif final_score >= 60:
            verdict = 'Hire with Reservations 🟡'
            verdict_color = '#d97706'
        elif final_score >= 40:
            verdict = 'Borderline — More Practice Needed 🟠'
            verdict_color = '#ea580c'
        else:
            verdict = 'Not Ready Yet — Keep Learning 🔴'
            verdict_color = '#dc2626'

        breakdown = []
        for i, fb in enumerate(feedbacks):
            q = questions[i] if i < len(questions) else {}
            breakdown.append({
                'question_index': i + 1,
                'type': q.get('type', ''),
                'question': q.get('question', ''),
                'score': fb['feedback'].get('score', 5),
                'verdict': fb['feedback'].get('verdict', ''),
                'feedback': fb['feedback'].get('feedback', ''),
                'ideal_points': fb['feedback'].get('ideal_points', [])
            })

        return jsonify({
            'session_id': session_id,
            'final_score': final_score,
            'avg_per_question': avg_score,
            'hiring_verdict': verdict,
            'verdict_color': verdict_color,
            'total_questions': len(questions),
            'answered': len(feedbacks),
            'breakdown': breakdown
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Initialize sample questions
    try:
        should_seed = os.getenv('INIT_SAMPLE_QUESTIONS', 'false').lower() == 'true'
        if not should_seed:
            app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', port=5000)
            raise SystemExit

        if questions_collection.count_documents({}) == 0:
            sample_questions = []
            for subject in CSE_SUBJECTS[:5]:  # Add questions for first 5 subjects
                for difficulty in ['easy', 'moderate-1', 'moderate-2', 'hard']:
                    for i in range(3):  # 3 questions per difficulty
                        sample_questions.append({
                            'subject': subject,
                            'difficulty': difficulty,
                            'question': f'{difficulty.capitalize()} question {i+1} for {subject}?',
                            'options': [f'Option {chr(65+j)}' for j in range(4)],
                            'correct_answer': i % 4
                        })
            if sample_questions:
                questions_collection.insert_many(sample_questions)
    except Exception as e:
        print(f"[WARNING] MongoDB seed skipped: {e}")
    
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', port=5000)

