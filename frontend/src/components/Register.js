import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    interests: [], capability_level: 'Beginner'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const interestsList = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Artificial Intelligence', 'Cyber Security', 'Cloud Computing', 'DevOps',
    'Blockchain', 'Game Development', 'UI/UX Design', 'Software Engineering',
  ];

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInterestToggle = (interest) =>
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter(i => i !== interest)
        : [...formData.interests, interest],
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/register', formData);
      onLogin(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '32px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="VantageLearn" style={{ width: '52px', height: '52px', objectFit: 'contain', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '25px', fontWeight: 900, color: 'var(--orange-600)', letterSpacing: '-0.5px', margin: 0 }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Join CodeMentorAI — start your adaptive learning journey
          </p>
        </div>

        <div className="card" style={{ borderColor: 'var(--border-o)', boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="Sandip Sharma"
                value={formData.name} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Minimum 8 characters"
                value={formData.password} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Starting Capability Level</label>
              <select name="capability_level" value={formData.capability_level} onChange={handleChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="input-group">
              <label>Your Interests (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {interestsList.map(interest => {
                  const active = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      style={{
                        padding: '7px 15px',
                        border: `2px solid ${active ? 'var(--orange-500)' : 'var(--border)'}`,
                        borderRadius: 'var(--r-full)',
                        background: active ? 'var(--grad)' : 'var(--surface)',
                        color: active ? 'white' : 'var(--text-2)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: 'var(--font)',
                        transition: 'all 0.18s',
                        boxShadow: active ? 'var(--shadow-btn)' : 'none',
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="error"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', fontSize: '15px', padding: '12px' }}
              disabled={loading}
            >
              {loading ? <span>Creating account…</span> : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: 'var(--text-muted)', marginBottom: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
