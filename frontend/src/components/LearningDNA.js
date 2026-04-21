import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import useBehaviorTracking from '../utils/useBehaviorTracking';
import '../App.css';

const LearningDNA = () => {
  useBehaviorTracking({ topic: 'learning_dna', action: 'view_profile' });
  const navigate = useNavigate();
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/learning/dna', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDna(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDNA();
  }, []);

  if (loading) return <div className="loading" style={{paddingTop: '80px'}}>Sequencing your Learning DNA...</div>;

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>← Back</button>
        <span className="proctor-badge" style={{background: 'var(--orange-500)'}}>🧠 Advanced Learning Profile</span>
      </div>

      <div className="dash-hero-card" style={{ padding: '40px', marginBottom: '24px', background: 'linear-gradient(135deg, #1C1917, #2D2723)' }}>
        <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '10px' }}>Your Learning DNA</h1>
        <p style={{ color: '#D6D3D1', fontSize: '15px', maxWidth: '600px' }}>
          This profile isn't about test scores. It aggregates your patience when reading, curiosity when asking Vantage questions, and deep self-awareness during reflection to map how you actually learn.
        </p>
      </div>

      <div className="dash-two-col">
        {/* Radar Chart Column */}
        <div className="dash-col-side" style={{ flex: 1 }}>
          <div className="card" style={{ height: '100%' }}>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="https://img.icons8.com/color/48/dna-helix.png" alt="dna" style={{width: 24}}/>
              Psychometric Traits
            </h2>
            <ResponsiveContainer width="100%" height={300}>
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dna?.traits || []}>
                 <PolarGrid stroke="var(--border)" />
                 <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                 <Radar name="Student" dataKey="value" stroke="var(--orange-500)" fill="var(--orange-500)" fillOpacity={0.3} strokeWidth={2} />
               </RadarChart>
            </ResponsiveContainer>
            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}><strong>Doubt Index:</strong> {dna?.metrics.total_doubts} interactions detected</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><strong>Reflection Depth:</strong> {dna?.metrics.total_reflections} logs analyzed</div>
            </div>
          </div>
        </div>

        <div className="dash-col-main" style={{ flex: 1 }}>
          <div className="card" style={{ height: '100%' }}>
            <h2 style={{ marginBottom: '16px' }}>Knowledge Concept Graph</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
               <div style={{ flex: 1, padding: '16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981' }}>
                 <div style={{ fontSize: '12px', color: '#065f46', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Mastered Nodes</div>
                 {dna?.strong_topics.map(t => <span key={t} className="badge-chip" style={{background: '#d1fae5', color: '#065f46', marginRight: '6px', border: 'none'}}>{t}</span>)}
               </div>
               <div style={{ flex: 1, padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #ef4444' }}>
                 <div style={{ fontSize: '12px', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Weak Nodes</div>
                 {dna?.weak_topics.map(t => <span key={t} className="badge-chip" style={{background: '#fee2e2', color: '#991b1b', marginRight: '6px', border: 'none'}}>{t}</span>)}
               </div>
            </div>
            
            <h3 style={{ fontSize: '18px', marginTop: '30px', marginBottom: '12px' }}>Targeted GenAI Prompts</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Based on your behavioral weaknesses, copy these custom engineered prompts to external LLMs to learn better:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dna?.weak_topics.map(topic => (
                <div key={topic} style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--orange-600)', display: 'block', marginBottom: '8px' }}>Prompt to repair {topic}:</span>
                  <em style={{ color: 'var(--text)' }}>"Act as a Socratic tutor. Provide an intuitive, non-technical analogy for {topic}. Do not give me the answer outright; ask me prompting questions to guide my understanding."</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDNA;
