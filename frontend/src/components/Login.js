import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const FEATURES = [
  { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, text: 'Adaptive questions that match your skill level' },
  { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, text: 'Real-time performance analytics & progress tracking' },
  { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, text: 'Free NPTEL & Coursera course recommendations' },
  { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, text: 'Compete on leaderboards and earn achievement badges' },
];

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/login', formData);
      onLogin(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font)' }}>

      {/* ── LEFT PANEL — Brand / Value Props ── */}
      <div style={{
        flex: '1 1 50%',
        background: 'var(--grad)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        color: 'white',
      }}
        className="auth-left-panel"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <img src="/logo.png" alt="VantageLearn"
            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '12px', background: 'rgba(255,255,255)', padding: '6px' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>CodeMentorAI</div>
            <div style={{ fontSize: '11px', opacity: 0.82, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Adaptive Learning Platform</div>
          </div>
        </div>

        <h1 style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-1px' }}>
          Master Computer<br />Science. Smarter.
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '40px', lineHeight: 1.6, fontWeight: 400 }}>
          AI-powered adaptive testing that grows with you — built for CSE students, freshers, and professionals.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, padding: '8px',
              }}>
                {f.icon}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.92 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '260px', height: '260px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40px', right: '-40px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div style={{
        flex: '1 1 50%',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>
            Sign in to continue your CodeMentorAI journey
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Your password"
                value={formData.password} onChange={handleChange} required />
            </div>

            {error && <div className="error"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}</div>}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '6px' }}
              disabled={loading}>
              {loading ? ' Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '24px 0', color: 'var(--text-muted)', fontSize: '13px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            or
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            New here?{' '}
            <Link to="/register" style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
              Create a free account
            </Link>
          </p>

          {/* Trust badges */}
          <div style={{
            display: 'flex', gap: '20px', justifyContent: 'center',
            marginTop: '40px', color: 'var(--text-muted)', fontSize: '12px',
          }}>
            {[
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: '#64748B' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
                text: 'Secure'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: '#10B981' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
                text: 'Free Forever'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: '#64748B' }}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
                text: 'Works on Mobile'
              }
            ].map((badge, index) => (
              <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                {badge.icon}
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
