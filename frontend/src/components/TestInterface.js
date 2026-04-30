import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import useBehaviorTracking from '../utils/useBehaviorTracking';

const VIOLATION_MESSAGES = {
  tab_switch: 'You switched tabs or minimized the window.',
  copy:       'Copying content is not allowed.',
  paste:      'Pasting content is not allowed.',
  cut:        'Cutting content is not allowed.',
  contextmenu:'Right-click is disabled during the exam.',
  shortcut:   'Keyboard shortcuts (Ctrl+C/V/X/A) are disabled.',
  screenshot: 'Screenshots are not allowed during the exam.',
};

const TestInterface = ({ user }) => {
  const { subject } = useParams();
  const navigate = useNavigate();

  useBehaviorTracking({ topic: decodeURIComponent(subject), action: 'take_test' });

  // ── Core test state ──────────────────────────────────────────────
  const [testId, setTestId]                 = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeStarted, setTimeStarted]       = useState(null);
  const [timeElapsed, setTimeElapsed]       = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(10);

  // ── Proctoring state ─────────────────────────────────────────────
  const [isTerminated, setIsTerminated]         = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [violationToast, setViolationToast]     = useState('');
  const [toastVisible, setToastVisible]         = useState(false);
  
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  // Refs to access latest state inside event listeners (closure safety)
  const testIdRef        = useRef(null);
  const isTerminatedRef  = useRef(false);
  const toastTimerRef    = useRef(null);

  // Sync refs with state
  useEffect(() => { testIdRef.current = testId; }, [testId]);
  useEffect(() => { isTerminatedRef.current = isTerminated; }, [isTerminated]);

  // ── Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timeStarted || isTerminated) return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeStarted, isTerminated]);

  // ── Start test ───────────────────────────────────────────────────
  useEffect(() => {
    startTest();
  }, []); // eslint-disable-line

  const startTest = async () => {
    try {
      // Read config set by SubjectSelection modal (falls back to defaults)
      let testCfg = { num_questions: 10, starting_difficulty: 'easy' };
      try {
        const saved = sessionStorage.getItem('testConfig');
        if (saved) { testCfg = { ...testCfg, ...JSON.parse(saved) }; }
        sessionStorage.removeItem('testConfig');
      } catch (_) {}

      // Parse subject -- if it contains commas, it's a Mixed Test
      const decodedSubj = decodeURIComponent(subject);
      const subjectPayload = decodedSubj.includes(',') ? decodedSubj.split(',') : decodedSubj;

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/test/start',
        {
          subject:              subjectPayload,
          num_questions:        testCfg.num_questions,
          starting_difficulty:  testCfg.starting_difficulty,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestId(response.data.test_id);
      setCurrentQuestion(response.data.question);
      setTimeStarted(Date.now());
      setTotalQuestions(response.data.num_questions || 10);
    } catch (err) {
      console.error('Failed to start test:', err);
      alert('Failed to start test. Please try again.');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  // ── Violation toast helper ───────────────────────────────────────
  const showToast = useCallback((msg) => {
    setViolationToast(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3500);
  }, []);

  // ── Terminate test ───────────────────────────────────────────────
  const terminateTest = useCallback(async (reason) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setIsTerminated(true);
    setTerminationReason(reason);

    const tid = testIdRef.current;
    if (tid) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/test/terminate',
          { test_id: tid, reason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to call terminate API:', err);
      }
    }
  }, []);

  // ── Anti-cheat event listeners ───────────────────────────────────
  useEffect(() => {
    // Block right-click
    const onContextMenu = (e) => {
      e.preventDefault();
      showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.contextmenu);
    };

    // Block copy / cut / paste
    const onCopy  = (e) => { e.preventDefault(); showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.copy); };
    const onCut   = (e) => { e.preventDefault(); showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.cut); };
    const onPaste = (e) => { e.preventDefault(); showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.paste); };

    // Block keyboard shortcuts
    const onKeyDown = (e) => {
      if (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.shortcut);
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        showToast('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: ' + VIOLATION_MESSAGES.screenshot);
      }
    };

    // Tab-switch / window minimise → TERMINATE immediately
    const onVisibilityChange = () => {
      if (document.hidden && !isTerminatedRef.current && testIdRef.current) {
        terminateTest('tab_switch');
      }
    };

    // Block text selection via mouse (extra layer)
    const onSelectStart = (e) => { e.preventDefault(); };

    document.addEventListener('contextmenu',      onContextMenu);
    document.addEventListener('copy',             onCopy);
    document.addEventListener('cut',              onCut);
    document.addEventListener('paste',            onPaste);
    document.addEventListener('keydown',          onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('selectstart',      onSelectStart);

    return () => {
      document.removeEventListener('contextmenu',      onContextMenu);
      document.removeEventListener('copy',             onCopy);
      document.removeEventListener('cut',              onCut);
      document.removeEventListener('paste',            onPaste);
      document.removeEventListener('keydown',          onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('selectstart',      onSelectStart);
    };
  }, [showToast, terminateTest]);

  // ── Answer submit ────────────────────────────────────────────────
  const handleAnswerSelect = (index) => setSelectedAnswer(index);

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) { alert('Please select an answer'); return; }
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/test/submit-answer',
        { test_id: testId, question_id: currentQuestion.question_id, selected_answer: selectedAnswer, time_taken: timeTaken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (questionNumber >= totalQuestions) {
        await finishTest();
      } else {
        setCurrentQuestion(response.data.next_question);
        setSelectedAnswer(null);
        setTimeStarted(Date.now());
        setTimeElapsed(0);
        setQuestionNumber(questionNumber + 1);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const finishTest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/test/finish',
        { test_id: testId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReflection(true);
    } catch (err) {
      console.error('Failed to finish test:', err);
      alert('Failed to finish test. Please try again.');
    }
  };

  const submitReflection = async () => {
    try {
      const token = localStorage.getItem('token');
      // If reflection is empty, it still sends it as empty, logging their avoidance.
      await axios.post('http://localhost:5000/api/learning/reflection', { reflection: reflectionText }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { 
      console.error('Failed to save reflection:', err); 
    }
    navigate(`/results/${testId}`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Progress bar % ────────────────────────────────────────────────
  const progress = ((questionNumber - 1) / totalQuestions) * 100;

  // ── Loading screen ───────────────────────────────────────────────
  if (loading) {
    return <div className="loading">Loading test...</div>;
  }

  // ── TERMINATED screen ─────────────────────────────────────────────
  if (isTerminated) {
    return (
      <div className="terminated-overlay">
        <div className="terminated-box">
          <div className="terminated-icon"></div>
          <h1 className="terminated-title">Test Terminated</h1>
          <p className="terminated-subtitle">
            {terminationReason === 'tab_switch'
              ? 'You switched tabs or minimized the browser window.'
              : 'A proctoring violation was detected.'}
          </p>
          <div className="terminated-rule-box">
            <h3>Why was my test terminated?</h3>
            <ul>
              <li>Switching browser tabs or windows is <strong>strictly prohibited</strong>.</li>
              <li>This is enforced by automated proctoring — just like TCS NQT, AMCAT, and eLitmus exams.</li>
              <li>Your partial answers (if any) have been saved.</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/subjects')}
            >
              Retake Test
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="loading">No question available</div>;
  }

  // ── REFLECTION screen ─────────────────────────────────────────────
  if (showReflection) {
    return (
      <div className="terminated-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', zIndex: 10000 }}>
        <div className="course-card" style={{ padding: '40px', width: '500px', maxWidth: '90%' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Test Completed! <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginLeft:8, color:"#10B981"}}><path d="M12 2l3 6 6 1-4.5 4.5 1.5 6-6-3.5L6 20l1.5-6L3 9l6-1z"></path></svg></h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Before you see your results, take a moment to reflect. What topics or specific questions did you find the most difficult? Active reflection increases retention by 30%.
          </p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px', outline: 'none' }}
            placeholder="I found the concepts of..."
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitReflection}>
            Complete & View Results
          </button>
        </div>
      </div>
    );
  }

  // ── Test UI ───────────────────────────────────────────────────────
  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>

      {/* Violation Toast */}
      {toastVisible && (
        <div className="violation-toast">
          {violationToast}
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>Adaptive Test: {decodeURIComponent(subject)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="proctor-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:6, color:"#64748B"}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Proctored Exam</div>
            <div className={`timer ${timeElapsed > 55 ? 'timer-warning' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:6, color:"#64748B"}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {formatTime(timeElapsed)}
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring warning banner */}
      <div className="proctor-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><strong>Proctored Environment:</strong> Tab switching, copy-paste, right-click, and keyboard shortcuts are disabled.
        Any violation will <strong>immediately terminate</strong> your test.
      </div>

      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="container">
        <div className="question-container">
          {/* ── HEADER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {decodeURIComponent(subject).includes(',') ? 'MIXED TEST' : decodeURIComponent(subject)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>
                Question {questionNumber} <span style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 600 }}>/ {totalQuestions}</span>
              </div>
              {currentQuestion?.subject && decodeURIComponent(subject).includes(',') && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', background: 'var(--orange-50)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  Subject: <strong style={{color: 'var(--orange-700)'}}>{currentQuestion.subject}</strong>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`difficulty-badge difficulty-${currentQuestion.difficulty}`} style={{ display: 'block', marginBottom: '12px' }}>
                {currentQuestion.difficulty}
              </span>
              {questionNumber < totalQuestions && (
                <button
                  className="btn btn-secondary"
                  onClick={finishTest}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Finish Early
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px', lineHeight: '1.5' }}>
              {currentQuestion.question}
            </h3>
            <ul className="options-list">
              {currentQuestion.options.map((option, index) => (
                <li
                  key={index}
                  className={`option-item ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="option-label">{String.fromCharCode(65 + index)}</span>
                  {option}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'right' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitting}
            >
              {submitting ? 'Submitting...' : questionNumber >= totalQuestions ? 'Finish Test' : 'Submit & Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
