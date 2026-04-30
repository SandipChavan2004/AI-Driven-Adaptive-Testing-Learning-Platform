import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import { explanationQuestions, getRandomItems, courseSuggestions, youtubeSuggestions } from '../data/questionsData';
import '../App.css';

const ExplanationMode = ({ user }) => {
  useBehaviorTracking({ topic: 'General', action: 'explanation_assessment' });
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setQuestions(getRandomItems(explanationQuestions, 10));
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if(event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
        }
        if(currentTranscript) {
          setText((prev) => prev ? prev + ' ' + currentTranscript : currentTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        alert("Speech Recognition is not supported in this browser. Please use Chrome.");
        return;
      }
    }
    setIsRecording(!isRecording);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return alert('Please provide an explanation.');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/learning/evaluate_text', {
        concept: questions[currentIndex].concept,
        explanation: text,
        is_audio: isRecording
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
      if(isRecording) recognitionRef.current?.stop();
      setIsRecording(false);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate explanation.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setText('');
      setResult(null);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleSkip = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    nextQuestion();
  };

  if (questions.length === 0) return <div>Loading...</div>;

  if (showSuggestions) {
    const recommendedCourses = getRandomItems(courseSuggestions, 2);
    const recommendedYouTube = getRandomItems(youtubeSuggestions, 2);
    return (
      <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
        <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>← Back to Subjects</button>
        <div className="course-card" style={{ padding: '30px' }}>
          <h2>Test Completed!</h2>
          <p>Great job practicing your explanations. Here are some resources we recommend to further improve your skills:</p>
          
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#EF4444"}}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
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
      <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>← Back to Subjects</button>
      
      <div className="course-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="proctor-badge" style={{background: 'var(--orange-500)'}}>Explanation Assessment ({currentQuestion.subject})</span>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <h2 style={{ fontSize: '24px', lineHeight: '1.4', marginBottom: '20px' }}>
          {currentQuestion.concept}
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
          Explain the concept in your own words. You can type or use your voice. We analyze depth of understanding over mere keyword matching.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start explaining here..."
          style={{ width: '100%', height: '200px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '16px', outline: 'none', resize: 'vertical' }}
          disabled={result !== null}
        />

        {!result && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <button 
              className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ display: 'flex', gap: '8px', alignItems: 'center', background: isRecording ? '#dc3545' : '', borderColor: isRecording ? '#dc3545' : '', color: isRecording ? 'white' : '' }}
              onClick={toggleRecording}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"#F97316"}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              {isRecording ? 'Stop Recording Voice' : 'Voice Explain'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={handleSkip} disabled={loading} style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                Skip
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Evaluating AI...' : 'Submit Explanation'}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="course-card" style={{ padding: '30px', marginTop: '24px', background: 'var(--grad)', color: 'white' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>AI Evaluation Results</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Score</div>
              <div style={{ fontSize: '32px', fontWeight: 900 }}>{result.score}/100</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Clarity Metric</div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{result.clarity_metric}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text)', padding: '20px', borderRadius: '12px', fontSize: '15px', lineHeight: '1.6' }}>
            <strong>Professor's Feedback:</strong><br />
            {result.feedback}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button className="btn btn-secondary" style={{ background: 'white', color: 'var(--orange-600)' }} onClick={nextQuestion}>
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish & View Courses'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplanationMode;
