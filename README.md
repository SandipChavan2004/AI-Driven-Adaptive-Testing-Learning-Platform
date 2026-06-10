# AI-Driven Adaptive Testing & Learning Platform

A comprehensive adaptive testing and learning analytics platform that personalizes education through AI-powered assessments, real-time recommendations, and advanced learning insights.

## 🌟 Features

### Core Testing Features
- **Adaptive Testing Algorithm**: Questions dynamically adjust difficulty based on user performance and response time
- **30 CSE Subjects**: Comprehensive coverage including DSA, DBMS, OS, CN, Python, Java, AI, ML, Cloud Computing, Cyber Security, and more
- **Spaced Repetition System (SRS)**: Scientific review scheduling using SM-2 algorithm for optimal retention
- **Real-time Performance Analytics**: Detailed metrics including accuracy, response time, capability scores, and learning trends

### AI-Powered Learning Tools
- **Learning DNA Analysis**: Advanced behavioral analytics mapping learning patterns, patience levels, and cognitive preferences
- **Resume Analyzer**: AI-powered resume parsing with skill gap analysis, ATS optimization, and personalized improvement recommendations
- **Mock Interview System**: AI-generated technical interviews with real-time evaluation and feedback
- **Project Code Evaluator**: Automated code review and assessment for programming assignments
- **Intelligent Chatbot**: Context-aware AI assistant for doubt clarification and learning support

### Personalization & Recommendations
- **YouTube Video Recommendations**: Curated educational content based on performance gaps
- **NPTEL Course Integration**: Direct links to IIT/IISc certified courses
- **Personalized Learning Paths**: 4-week structured improvement plans
- **Skill Gap Analysis**: Technical and soft skill assessments with priority-based recommendations

### Gamification & Engagement
- **Streak Tracking**: Daily learning streaks with milestone rewards
- **Achievement Badges**: Unlockable badges for learning milestones
- **Global Leaderboard**: Competitive rankings across subjects and time periods
- **Daily Challenges**: Scenario-based coding and system design challenges
- **Progress Visualization**: Interactive charts and radar plots for learning analytics

### User Experience
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Multi-language Support**: Internationalization ready (i18next)
- **Responsive Design**: Mobile-first approach with modern UI
- **PDF Export**: Generate detailed performance reports
- **Behavior Tracking**: Anonymous usage analytics for platform improvement

## ?? Tech Stack

### Backend
- **Framework**: Flask (Python 3.8+)
- **Database**: MongoDB with PyMongo
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI GPT API
- **Rate Limiting**: Flask-Limiter
- **File Processing**: PDFPlumber, python-docx
- **External APIs**: YouTube Data API v3

### Frontend
- **Framework**: React 18 with Hooks
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **PDF Generation**: jsPDF, html2canvas
- **Internationalization**: react-i18next
- **Styling**: Custom CSS with CSS Variables

### Infrastructure
- **Deployment**: Ready for Docker/Vercel
- **Environment**: Python virtualenv
- **Package Management**: pip (backend), npm (frontend)

- **Backend**: Flask (Python)
- **Frontend**: React
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **APIs**: YouTube Data API v3

## Project Structure

```
.
├── backend/
│   ├── app.py              # Flask backend application
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud instance)
- YouTube Data API Key (optional, for video recommendations)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:
```bash
cp .env.example .env
```

5. Edit `.env` and add your configuration:
```
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET_KEY=your-secret-key-change-in-production
YOUTUBE_API_KEY=your-youtube-api-key
```

6. Start MongoDB (if running locally):
```bash
mongod
```

7. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📖 Usage

### For Students
1. **Register**: Create account with personal details and interests
2. **Subject Selection**: Choose from 30 CSE subjects
3. **Adaptive Testing**: Take intelligent tests that adjust difficulty
4. **Review Performance**: Analyze detailed results and trends
5. **Get Recommendations**: Access personalized YouTube videos and courses
6. **Track Progress**: Monitor streaks, badges, and leaderboard ranking
7. **Advanced Features**: Use resume analyzer, mock interviews, and learning DNA

### For Educators/Administrators
- Monitor student progress through analytics
- Access leaderboard and performance data
- Review system-wide learning patterns
- Generate reports and insights

## 🎯 Adaptive Testing Logic

The platform uses a sophisticated algorithm combining:
- **Correctness**: Right/wrong answers
- **Response Time**: Fast (<30s) vs slow (>60s) responses
- **Difficulty Levels**: easy → moderate-1 → moderate-2 → hard
- **Spaced Repetition**: SM-2 algorithm for optimal review timing
- **Capability Scoring**: Weighted combination of accuracy (60%) and efficiency (40%)

## 🔗 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/auth/refresh` - Refresh access tokens

### Testing
- `GET /api/subjects` - Get available subjects
- `POST /api/test/start` - Initialize new test
- `POST /api/test/submit-answer` - Submit answer and get next question
- `POST /api/test/finish` - Complete test and get analytics
- `GET /api/practice/:subject` - Practice mode questions

### Analytics & Recommendations
- `GET /api/user/dashboard` - User dashboard data
- `POST /api/recommendations` - Get personalized recommendations
- `GET /api/leaderboard` - Global rankings
- `GET /api/test/due-reviews` - Spaced repetition reviews

### AI Features
- `POST /api/learning/evaluate_explanation` - Evaluate concept explanations
- `POST /api/learning/evaluate_project` - Code review and evaluation
- `POST /api/chatbot/ask` - AI chatbot interactions
- `POST /api/learning/reflection` - Save learning reflections

### Advanced Analytics
- `GET /api/learning/dna` - Learning DNA analysis
- `POST /api/resume/analyze` - Resume analysis with AI
- `GET /api/resume/analysis` - Get stored resume analysis
- `POST /api/resume/resources` - Generate learning resources

### Gamification
- `GET /api/user/notifications` - Get user notifications
- `GET /api/challenges/daily` - Daily coding challenges
- `POST /api/analytics/behavior` - Track user behavior

## 📊 Data Models

### User Collections
- **users**: User profiles, streaks, preferences
- **tests**: Test sessions and results
- **questions**: Question bank with metadata
- **cards**: SRS review cards
- **notifications**: User notifications
- **learning_behavior**: Anonymous usage analytics
- **evaluations**: AI evaluation results
- **resumes**: Resume analysis data
- **interview_sessions**: Mock interview data

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- Secure password hashing with bcrypt
- Environment variable protection

## 🌐 Deployment

### Local Development
- Follow installation steps above
- Use `python check_env.py` to verify configuration

### Production Deployment
1. Set production environment variables
2. Use a production WSGI server (gunicorn)
3. Configure MongoDB replica set for high availability
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NPTEL**: IIT/IISc certified courses integration
- **YouTube API**: Educational video recommendations
- **OpenAI**: AI-powered learning assistance
- **MongoDB**: Flexible document database
- **React Community**: Modern frontend framework

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation for common solutions

---

**Happy Learning! 🚀**

## Usage

1. **Register**: Create a new account with your details, interests, and capability level
2. **Select Subject**: Choose from 30 CSE subjects
3. **Take Test**: Answer adaptive questions (difficulty adjusts based on performance)
4. **View Results**: See detailed analytics and personalized recommendations
5. **Get Recommendations**: Access YouTube videos and course links tailored to your performance

## Adaptive Testing Logic

- **Starts Easy**: All tests begin with easy questions
- **Increases Difficulty**: If answer is correct and fast (< 30 seconds), difficulty increases
- **Decreases Difficulty**: If answer is incorrect or slow (> 60 seconds), difficulty decreases
- **Difficulty Levels**: easy → moderate-1 → moderate-2 → hard

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/subjects` - Get all subjects
- `POST /api/test/start` - Start a new test
- `POST /api/test/submit-answer` - Submit an answer
- `POST /api/test/finish` - Finish test and get analytics
- `POST /api/recommendations` - Get personalized recommendations
- `GET /api/user/dashboard` - Get user dashboard data

## Notes

- The system includes sample questions for demonstration. In production, you should populate the database with comprehensive question sets for all subjects.
- YouTube API key is optional but recommended for video recommendations.
- The system automatically creates sample questions for the first 5 subjects on first run.



## ?? Usage

### For Students
1. **Register**: Create account with personal details and interests
2. **Subject Selection**: Choose from 30 CSE subjects
3. **Adaptive Testing**: Take intelligent tests that adjust difficulty
4. **Review Performance**: Analyze detailed results and trends
5. **Get Recommendations**: Access personalized YouTube videos and courses
6. **Track Progress**: Monitor streaks, badges, and leaderboard ranking
7. **Advanced Features**: Use resume analyzer, mock interviews, and learning DNA

### For Educators/Administrators
- Monitor student progress through analytics
- Access leaderboard and performance data
- Review system-wide learning patterns
- Generate reports and insights

## ?? Adaptive Testing Logic

The platform uses a sophisticated algorithm combining:
- **Correctness**: Right/wrong answers
- **Response Time**: Fast (<30s) vs slow (>60s) responses
- **Difficulty Levels**: easy ? moderate-1 ? moderate-2 ? hard
- **Spaced Repetition**: SM-2 algorithm for optimal review timing
- **Capability Scoring**: Weighted combination of accuracy (60%) and efficiency (40%)

## ?? API Endpoints

### Authentication
- POST /api/register - User registration
- POST /api/login - User authentication
- POST /api/auth/refresh - Refresh access tokens

### Testing
- GET /api/subjects - Get available subjects
- POST /api/test/start - Initialize new test
- POST /api/test/submit-answer - Submit answer and get next question
- POST /api/test/finish - Complete test and get analytics
- GET /api/practice/:subject - Practice mode questions

### Analytics & Recommendations
- GET /api/user/dashboard - User dashboard data
- POST /api/recommendations - Get personalized recommendations
- GET /api/leaderboard - Global rankings
- GET /api/test/due-reviews - Spaced repetition reviews

### AI Features
- POST /api/learning/evaluate_explanation - Evaluate concept explanations
- POST /api/learning/evaluate_project - Code review and evaluation
- POST /api/chatbot/ask - AI chatbot interactions
- POST /api/learning/reflection - Save learning reflections

### Advanced Analytics
- GET /api/learning/dna - Learning DNA analysis
- POST /api/resume/analyze - Resume analysis with AI
- GET /api/resume/analysis - Get stored resume analysis
- POST /api/resume/resources - Generate learning resources

### Gamification
- GET /api/user/notifications - Get user notifications
- GET /api/challenges/daily - Daily coding challenges
- POST /api/analytics/behavior - Track user behavior

## ?? Data Models

### User Collections
- **users**: User profiles, streaks, preferences
- **tests**: Test sessions and results
- **questions**: Question bank with metadata
- **cards**: SRS review cards
- **notifications**: User notifications
- **learning_behavior**: Anonymous usage analytics
- **evaluations**: AI evaluation results
- **resumes**: Resume analysis data
- **interview_sessions**: Mock interview data

## ?? Security Features

- JWT-based authentication with refresh tokens
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- Secure password hashing with bcrypt
- Environment variable protection

## ?? Deployment

### Local Development
- Follow installation steps above
- Use python check_env.py to verify configuration

### Production Deployment
1. Set production environment variables
2. Use a production WSGI server (gunicorn)
3. Configure MongoDB replica set for high availability
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)

## ?? Contributing

1. Fork the repository
2. Create feature branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open Pull Request

## ?? License

This project is licensed under the MIT License - see the LICENSE file for details.

## ?? Acknowledgments

- **NPTEL**: IIT/IISc certified courses integration
- **YouTube API**: Educational video recommendations
- **OpenAI**: AI-powered learning assistance
- **MongoDB**: Flexible document database
- **React Community**: Modern frontend framework

## ?? Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation for common solutions

---

**Happy Learning! ??**
