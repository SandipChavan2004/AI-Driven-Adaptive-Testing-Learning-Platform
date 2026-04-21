import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import '../App.css';

const ExplanationMode = ({ subject = "Data Structures", concept = "Explain how a Hash Table works, including collision resolution.", user }) => {
  useBehaviorTracking({ topic: subject, action: 'explanation_assessment' });
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);

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
        concept: concept,
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

  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
      <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>← Back to Subjects</button>
      
      <div className="course-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span className="proctor-badge" style={{background: 'var(--orange-500)'}}>Explanation Assessment ({subject})</span>
        </div>
        <h2 style={{ fontSize: '24px', lineHeight: '1.4', marginBottom: '20px' }}>
          {concept}
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
          Explain the concept in your own words. You can type or use your voice. We analyze depth of understanding over mere keyword matching.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start explaining here... e.g. A Hash Table is a data structure that..."
          style={{ width: '100%', height: '200px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '16px', outline: 'none', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <button 
            className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: isRecording ? '#dc3545' : '', borderColor: isRecording ? '#dc3545' : '', color: isRecording ? 'white' : '' }}
            onClick={toggleRecording}
          >
            <img src="https://img.icons8.com/color/48/microphone.png" style={{width: 20}} alt="mic" />
            {isRecording ? 'Stop Recording Voice' : 'Voice Explain'}
          </button>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Evaluating AI...' : 'Submit Explanation'}
          </button>
        </div>
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
        </div>
      )}
    </div>
  );
};

export default ExplanationMode;
