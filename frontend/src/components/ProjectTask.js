import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import { projectQuestions, getRandomItems, courseSuggestions, youtubeSuggestions } from '../data/questionsData';
import '../App.css';

const ProjectTask = ({ user }) => {
  useBehaviorTracking({ topic: 'General', action: 'project_evaluation' });
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [timeStarted, setTimeStarted] = useState(Date.now());
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setQuestions(getRandomItems(projectQuestions, 10));
  }, []);

  const handleSubmit = async () => {
    if (!code.trim()) return alert('Please write some code before submitting.');
    setLoading(true);
    const time_taken = Math.floor((Date.now() - timeStarted) / 1000);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/learning/evaluate_project', {
        task_prompt: questions[currentIndex].task,
        code_submission: code,
        time_taken
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate project.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCode('');
      setResult(null);
      setTimeStarted(Date.now());
    } else {
      setShowSuggestions(true);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  if (showSuggestions) {
    const recommendedCourses = getRandomItems(courseSuggestions, 2);
    const recommendedYouTube = getRandomItems(youtubeSuggestions, 2);
    return (
      <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
        <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>Back to Subjects</button>
        <div className="course-card" style={{ padding: '30px' }}>
          <h2>Practice Completed!</h2>
          <p>Great job writing code. Here are some resources we recommend to further improve your skills:</p>
          
          <h3 style={{ marginTop: '20px', fontSize: '18px' }}>Recommended Courses</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            {recommendedCourses.map((c, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--orange-600)', fontWeight: 700 }}>{c.subject}</div>
                <h4 style={{ margin: '10px 0' }}>{c.course}</h4>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>View Course</a>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '30px', fontSize: '18px' }}>Recommended YouTube Videos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            {recommendedYouTube.map((y, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', background: 'var(--surface)' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#ff0000', fontWeight: 700 }}>{y.channel}</div>
                </div>
                <h4 style={{ margin: '0 0 10px 0' }}>{y.title}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Topic: {y.subject}</div>
                <a href={y.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-block', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', borderColor: '#ff0000', color: '#ff0000' }}>Watch Video</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
      <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>Back to Subjects</button>
      
      <div className="course-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="proctor-badge" style={{background: 'var(--orange-500)'}}>Mini Project Evaluation ({currentQuestion.subject})</span>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Task {currentIndex + 1} of {questions.length}</span>
        </div>
        <h2 style={{ fontSize: '24px', lineHeight: '1.4', marginBottom: '20px' }}>
          {currentQuestion.task}
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
          Write your solution in the editor below. Do not worry about perfect syntax; structure and logic are prioritized.
        </p>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="-- Write your code here..."
          style={{ width: '100%', height: '250px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '15px', outline: 'none', resize: 'vertical', fontFamily: 'monospace', background: '#f8f9fa' }}
          spellCheck={false}
          disabled={result !== null}
        />

        {!result && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={nextQuestion} disabled={loading} style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
              Skip
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Evaluating Structure...' : 'Submit Code'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="course-card" style={{ padding: '30px', marginTop: '24px', background: 'var(--grad)', color: 'white' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>Code Review</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Score</div>
              <div style={{ fontSize: '32px', fontWeight: 900 }}>{result.score}/100</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Structure Quality</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{result.structure_quality}</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text)', padding: '20px', borderRadius: '12px', fontSize: '15px', lineHeight: '1.6' }}>
            <strong>Code Feedback:</strong><br />
            {result.feedback}
            
            {result.errors_found && result.errors_found.length > 0 && (
              <div style={{ marginTop: '16px', color: '#dc3545' }}>
                <strong>Potential Issues Flagged:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  {result.errors_found.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button className="btn btn-secondary" style={{ background: 'white', color: 'var(--orange-600)' }} onClick={nextQuestion}>
              {currentIndex < questions.length - 1 ? 'Next Task' : 'Finish & View Courses'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTask;
