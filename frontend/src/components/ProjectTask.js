import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import '../App.css';

const ProjectTask = ({ subject = "DBMS", task_prompt = "Write an SQL query to find the 2nd highest salary from an Employee table.", user }) => {
  useBehaviorTracking({ topic: subject, action: 'project_evaluation' });
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [timeStarted] = useState(Date.now());

  const handleSubmit = async () => {
    if (!code.trim()) return alert('Please write some code before submitting.');
    setLoading(true);
    const time_taken = Math.floor((Date.now() - timeStarted) / 1000);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/learning/evaluate_project', {
        task_prompt: task_prompt,
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

  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
      <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/subjects')}>← Back to Subjects</button>
      
      <div className="course-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span className="proctor-badge" style={{background: 'var(--orange-500)'}}>Mini Project Evaluation</span>
        </div>
        <h2 style={{ fontSize: '24px', lineHeight: '1.4', marginBottom: '20px' }}>
          {task_prompt}
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
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Evaluating Structure...' : 'Submit Code'}
          </button>
        </div>
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
        </div>
      )}
    </div>
  );
};

export default ProjectTask;
