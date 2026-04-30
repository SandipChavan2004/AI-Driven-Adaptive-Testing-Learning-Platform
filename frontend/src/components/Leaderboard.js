import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const MEDAL = ['1st', '2nd', '3rd'];

const Leaderboard = ({ user }) => {
  const navigate    = useNavigate();
  const [data,      setData]      = useState(null);
  const [subjects,  setSubjects]  = useState([]);
  const [subject,   setSubject]   = useState('');
  const [period,    setPeriod]    = useState('all');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/subjects', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => setSubjects(r.data.subjects)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line
  }, [subject, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (subject) params.subject = subject;
      const res = await axios.get('http://localhost:5000/api/leaderboard', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg> Leaderboard</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="container">
        <div className="card">
          {/* Filters */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <label style={{ fontWeight: 600, marginRight: '8px' }}>Subject:</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px' }}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, marginRight: '8px' }}>Period:</label>
              {['all', 'monthly', 'weekly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ marginRight: '6px', padding: '7px 16px', fontSize: '13px' }}
                >
                  {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading rankings...</div>
          ) : data && data.leaderboard.length > 0 ? (
            <>
              <h2 style={{ marginBottom: '4px' }}>
                {data.subject} — {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
              </h2>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
                Top {data.total} performers ranked by best capability score
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['Rank', 'User', 'Best Score', 'Avg Score', 'Tests', 'Level'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: '13px', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.leaderboard.map(entry => {
                      const isMe = entry.name === user?.name;
                      return (
                        <tr
                          key={entry.rank}
                          style={{
                            borderBottom: '1px solid #f0f0f0',
                            background: isMe ? '#f0f4ff' : 'white',
                            transition: 'background 0.2s'
                          }}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '18px' }}>
                            {entry.rank <= 3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: isMe ? 700 : 400 }}>
                            {entry.name} {isMe && <span style={{ color: '#667eea', fontSize: '12px' }}>(you)</span>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className="score-pill">{entry.best_score}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#666' }}>{entry.avg_score}</td>
                          <td style={{ padding: '14px 16px', color: '#666' }}>{entry.tests_taken}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`level-tag level-${(entry.best_level || '').toLowerCase()}`}>
                              {entry.best_level || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg></div>
              <p>No results yet for this filter. Be the first to complete a test!</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/subjects')}>
                Start a Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
