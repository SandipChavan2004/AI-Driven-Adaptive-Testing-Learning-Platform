import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import useBehaviorTracking from '../utils/useBehaviorTracking';

const DIFFICULTIES = ['easy', 'moderate-1', 'moderate-2', 'hard'];
const DIFF_LABELS  = { 'easy': 'Easy', 'moderate-1': 'Moderate I', 'moderate-2': 'Moderate II', 'hard': 'Hard' };

const PracticeMode = ({ user }) => {
  const { subject }   = useParams();
  const navigate       = useNavigate();
  const decodedSubject = decodeURIComponent(subject);

  useBehaviorTracking({ topic: decodedSubject, action: 'practice' });

  const [difficulty,       setDifficulty]       = useState('easy');
  const [question,         setQuestion]         = useState(null);
  const [selectedAnswer,   setSelectedAnswer]   = useState(null);
  const [revealed,         setRevealed]         = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [stats,            setStats]            = useState({ total: 0, correct: 0 });
  const [feedback,         setFeedback]         = useState(null); // 'correct' | 'wrong'
  const [aiExplanation,    setAiExplanation]    = useState('');
  const [loadingAi,        setLoadingAi]        = useState(false);
  const excludedRef = useRef([]);

  // Load first question on mount / difficulty change
  useEffect(() => {
    loadQuestion();
    // eslint-disable-next-line
  }, [difficulty]);

  const loadQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setRevealed(false);
    setFeedback(null);
    setAiExplanation('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/practice/question', {
        params: {
          subject:    decodedSubject,
          difficulty,
          exclude:    excludedRef.current.join(','),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestion(res.data);
      excludedRef.current = [...excludedRef.current, res.data.question_id].slice(-40);
    } catch (err) {
      console.error('Failed to load practice question:', err);
      alert('No questions available for this combination. Try a different difficulty.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelectedAnswer(idx);
  };

  const handleReveal = () => {
    if (selectedAnswer === null) { alert('Please choose an answer first.'); return; }
    const correct = question.correct_answer === selectedAnswer;
    setFeedback(correct ? 'correct' : 'wrong');
    setRevealed(true);
    setStats(s => ({ total: s.total + 1, correct: s.correct + (correct ? 1 : 0) }));
  };

  const getAiExplanation = async () => {
    setLoadingAi(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/ai/explain', {
        question: question.question,
        options: question.options,
        correct_answer: question.options[question.correct_answer],
        selected_answer: question.options[selectedAnswer],
        subject: question.subject
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAiExplanation(res.data.explanation);
    } catch (err) {
      console.error(err);
      setAiExplanation("Failed to load AI explanation.");
    } finally {
      setLoadingAi(false);
    }
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (loading && !question) return <div className="loading">Loading practice question...</div>;

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>🎯 Practice Mode — {decodedSubject}</h1>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span className="proctor-badge" style={{ background: '#28a745' }}>No Time Limit</span>
            <button className="btn btn-secondary" onClick={() => navigate('/subjects')}>← Back</button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center'
        }}>
          <div className="practice-stat">✅ Correct: <strong>{stats.correct}</strong></div>
          <div className="practice-stat">📝 Total:   <strong>{stats.total}</strong></div>
          <div className="practice-stat" style={{ color: accuracy >= 60 ? '#28a745' : '#dc3545' }}>
            🎯 Accuracy: <strong>{accuracy}%</strong>
          </div>

          {/* Difficulty selector */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`btn ${difficulty === d ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => { excludedRef.current = []; setDifficulty(d); }}
              >
                {DIFF_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Question card */}
        {question && !loading && (
          <div className="question-container">
            <div className="question-header">
              <div>
                <span className="practice-mode-tag">Practice</span>
                <span className={`difficulty-badge difficulty-${question.difficulty}`} style={{ marginLeft: '10px' }}>
                  {DIFF_LABELS[question.difficulty] || question.difficulty}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px' }}
                onClick={loadQuestion}
                disabled={loading}
              >
                Skip →
              </button>
            </div>

            <h3 style={{ margin: '24px 0 20px', fontSize: '19px', lineHeight: '1.55' }}>
              {question.question}
            </h3>

            <ul className="options-list">
              {question.options.map((opt, idx) => {
                let extraStyle = '';
                if (revealed) {
                  if (idx === question.correct_answer) extraStyle = 'option-correct';
                  else if (idx === selectedAnswer && idx !== question.correct_answer) extraStyle = 'option-wrong';
                }
                return (
                  <li
                    key={idx}
                    className={`option-item ${selectedAnswer === idx ? 'selected' : ''} ${extraStyle}`}
                    onClick={() => handleSelect(idx)}
                    style={{ cursor: revealed ? 'default' : 'pointer' }}
                  >
                    <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                    {opt}
                    {revealed && idx === question.correct_answer && (
                      <span style={{ marginLeft: 'auto', color: '#28a745', fontWeight: 700 }}>✓ Correct</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Feedback */}
            {revealed && (
              <div className={`practice-feedback ${feedback}`}>
                {feedback === 'correct'
                  ? '🎉 Correct! Well done.'
                  : `❌ Incorrect. The correct answer is: ${String.fromCharCode(65 + question.correct_answer)}. ${question.options[question.correct_answer]}`}
              </div>
            )}

            {/* AI Explanation Area */}
            {revealed && !aiExplanation && !loadingAi && (
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={getAiExplanation}>
                <img src="https://img.icons8.com/fluency/24/magic-star.png" alt="AI" style={{ width: '16px' }} />
                Ask AI for explanation
              </button>
            )}
            {loadingAi && <div style={{ fontSize: '13px', color: 'var(--orange-500)', marginTop: '12px', fontWeight: 600 }}>✨ AI is thinking...</div>}
            {aiExplanation && (
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: 'var(--orange-50)', border: '1px solid var(--border-o)', fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--orange-600)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src="https://img.icons8.com/fluency/24/magic-star.png" alt="AI" style={{ width: '16px' }} />
                  AI Explanation
                </div>
                {/* Extremely basic markdown bold parser for aesthetics */}
                <div dangerouslySetInnerHTML={{ __html: aiExplanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              {!revealed ? (
                <button
                  className="btn btn-primary"
                  onClick={handleReveal}
                  disabled={selectedAnswer === null}
                >
                  Check Answer
                </button>
              ) : (
                <button className="btn btn-primary" onClick={loadQuestion}>
                  Next Question →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
