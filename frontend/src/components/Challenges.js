import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import '../App.css';

const Challenges = ({ user }) => {
  useBehaviorTracking({ topic: 'gamified_challenges', action: 'view_challenges' });
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/challenges/daily', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChallenge(res.data.challenge);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, []);

  if (loading) return <div className="loading">Loading daily scenario...</div>;

  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '800px' }}>
      <button className="btn btn-secondary" style={{marginBottom: '20px'}} onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      
      <div className="course-card" style={{ padding: '40px', background: 'linear-gradient(135deg, #1C1917, #2D2723)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: 'var(--orange-500)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '8px' }}>
              🔥 Daily Scenario
            </div>
            <h1 style={{ fontSize: '28px', marginBottom: '16px', lineHeight: 1.2 }}>{challenge?.title || "Scenario Not Found"}</h1>
          </div>
          <div style={{ background: 'rgba(249,115,22,0.2)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--orange-500)' }}>
            <div style={{ fontSize: '11px', color: 'var(--orange-400)', textTransform: 'uppercase', fontWeight: 700 }}>Reward</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>+{challenge?.xp || 0} XP</div>
          </div>
        </div>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#D6D3D1', marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '4px solid var(--orange-500)' }}>
          {challenge?.desc || "Come back tomorrow for a new real-world challenge!"}
        </p>

        <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/project')}>
            Solve via Code →
          </button>
          <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => navigate('/explain')}>
            Solve via Voice 🎙️
          </button>
        </div>
      </div>
{/* Added Peer Comparison Mock as requested in Phase 3 (#10 "Peer Comparison Without Test") */}
      <div className="course-card" style={{ padding: '30px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <img src="https://img.icons8.com/fluency/48/group.png" alt="peer" style={{ width: '24px' }} />
          <h3 style={{ fontSize: '20px', margin: 0 }}>Peer Insights</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Based on your activity, interactions, and challenge attempts compared to others in your cohort.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, padding: '16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
            <div style={{ color: '#059669', fontWeight: 800, fontSize: '24px' }}>Top 12%</div>
            <div style={{ fontSize: '13px', color: '#065f46', marginTop: '4px', fontWeight: 600 }}>In Conceptual Explanations</div>
          </div>
          <div style={{ flex: 1, padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '24px' }}>2x Faster</div>
            <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px', fontWeight: 600 }}>At Learning New Syntax</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;
