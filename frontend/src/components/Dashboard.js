import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import StreakCalendar from './StreakCalendar';
import '../App.css';
import { DEFAULT_SUBJECT_IMAGE, getSubjectImage } from '../utils/subjectImages';

/* ── Inline sub-components ─────────────────────────────── */

/* Recharts Score Trend — replaces old TrendChart */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--orange-600)' }}>{payload[0].value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>score</div>
      </div>
    );
  }
  return null;
};

const ScoreTrendChart = ({ trend }) => {
  const data = trend.map((t, i) => ({
    name: (t.subject || `T${i + 1}`).substring(0, 6),
    score: Math.round(t.score || 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F97316" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2.5}
          dot={{ fill: '#F97316', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#EA580C' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/* ── Icons for existing platform subjects ───────────────── */
// eslint-disable-next-line no-unused-vars
const ICON_MAP = {
  'Cloud Computing': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>,
  'C Programming':   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  'AT':              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Python':          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  'Algorithm':       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'CN':              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path></svg>,
  'CSCL':            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Data Structures': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
  'DBMS':            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
  'DCN':             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path></svg>,
  'DMS':             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'DSMP':            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'IoT':             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path></svg>,
  'Java':            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  'Maths':           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'ML':              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'OOP':             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'OS':              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'WebTech':         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  /* ── Icons for coming-soon subjects ── */
  'JavaScript':         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  'Android Dev':        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Cyber Security':     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'DevOps':             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Blockchain':         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Game Development':   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'UI/UX Design':       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  'Software Engineering': <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  'default':            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--orange-500)"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
};

/* Subjects not yet in the exam platform — shown with Coming Soon badge */
const COMING_SOON = new Set([
  'JavaScript', 'Android Dev', 'Cyber Security', 'DevOps',
  'Blockchain', 'Game Development', 'UI/UX Design', 'Software Engineering',
]);

/* Every registration interest mapped to its relevant subjects (existing + new) */
const INTEREST_TO_SUBJECTS = {
  'Web Development':       ['WebTech', 'JavaScript', 'Python', 'OOP', 'DBMS'],
  'Mobile Development':    ['Java', 'Android Dev', 'OOP', 'DBMS', 'CN'],
  'Data Science':          ['DSMP', 'ML', 'Python', 'Maths', 'Data Structures', 'Algorithm'],
  'Machine Learning':      ['ML', 'DSMP', 'Python', 'Algorithm', 'Data Structures', 'Maths'],
  'Artificial Intelligence': ['ML', 'AT', 'DSMP', 'Algorithm', 'Python'],
  'Cyber Security':        ['Cyber Security', 'CN', 'DCN', 'OS', 'C Programming', 'DBMS'],
  'Cloud Computing':       ['Cloud Computing', 'OS', 'CN', 'DevOps', 'DBMS'],
  'DevOps':                ['DevOps', 'Cloud Computing', 'OS', 'CN', 'DBMS'],
  'Blockchain':            ['Blockchain', 'CN', 'DMS', 'Maths', 'DBMS'],
  'Game Development':      ['Game Development', 'C Programming', 'OOP', 'Algorithm', 'Data Structures', 'Python'],
  'UI/UX Design':          ['UI/UX Design', 'JavaScript', 'WebTech', 'Python'],
  'Software Engineering':  ['Software Engineering', 'OOP', 'Data Structures', 'Algorithm', 'DBMS', 'OS', 'CSCL'],
};

/* Fallback when user has no interests */
const POPULAR_SUBJECTS = ['Python', 'DBMS', 'OS', 'ML', 'Java', 'Data Structures', 'CN', 'Algorithm'];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Main Dashboard ─────────────────────────────────────── */
const Dashboard = ({ user }) => {
  const { t } = useTranslation();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dueReviews, setDueReviews] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const [dsRes, rvRes] = await Promise.all([
        axios.get('http://localhost:5000/api/user/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/test/due-reviews', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setData(dsRes.data);
      setDueReviews(rvRes.data.due_count || 0);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="app-layout">
      <div className="loading" style={{ paddingTop: '80px' }}>Loading your dashboard…</div>
    </div>
  );

  const {
    stats = {}, badges = [], trend = [],
    subject_best = {}, test_history = [], user: uData = {}
  } = data || {};

  const streak    = stats.streak    || 0;
  const maxStreak = stats.max_streak || 0;
  const level     = uData.capability_level || 'Beginner';
  const firstName = (uData.name || user?.name || 'Learner').split(' ')[0];

  const statusStyle = (s) => ({
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    background: s === 'completed' ? '#DCFCE7' : s === 'terminated' ? '#FEF2F2' : '#FFF3CD',
    color:      s === 'completed' ? '#15803D' : s === 'terminated' ? '#DC2626' : '#92400E',
  });

  return (
    <div className="app-layout">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── HERO WELCOME CARD ── */}
        <div className="dash-hero-card">
          <div className="dash-hero-left">
            <div className="dash-hero-greeting">{t(getGreeting())}, {firstName}!</div>
            <h1 className="dash-hero-title">
              {streak > 0
                ? `You're on a ${streak}-day streak. Keep it up!`
                : t('Ready to start')}
            </h1>
            <div className="dash-hero-meta">
              <span className={`level-tag level-${level.toLowerCase()}`}>{level}</span>
              {streak > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                  {streak} day streak
                </span>
              )}
              {dueReviews > 0 && (
                <span onClick={() => navigate('/practice/Mixed')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {dueReviews} Reviews Due
                </span>
              )}
            </div>
          </div>
          <div className="dash-hero-right" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '240px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/subjects')} style={{ width: '100%', background: 'var(--orange-400)', color: 'white', border: 'none', boxShadow: 'var(--shadow-md)', padding: '12px 14px', fontSize: '14px', minWidth: '0' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><path d="M9 17l-4-4 4-4"></path><path d="M15 7l4 4-4 4"></path></svg>
                Test
              </span>
            </button>
            <button className="btn btn-white" onClick={() => navigate('/explain')} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><path d="M12 20h9"></path><path d="M12 4h9"></path><path d="M4 9h16"></path><path d="M4 15h16"></path></svg>
              Test Yourself
            </button>
            <button className="btn btn-white" onClick={() => navigate('/project')} style={{ width: '100%', padding: '12px 14px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18"></path></svg>
              Mini Code Practice
            </button>
          </div>
          {/* decorative circles */}
          <div className="hero-circle hero-circle-1" />
          <div className="hero-circle hero-circle-2" />
        </div>

        {/* ── STATS ROW ── */}
        <div className="stats-row" style={{ marginTop: '24px' }}>
          {[
            { label: t('Tests Taken'),  value: stats.completed_tests || 0, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, sub: 'total' },
            { label: t('Average Score'),    value: stats.avg_score || 0,       icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>, sub: 'out of 100' },
            { label: 'Best Score',   value: stats.best_score || 0,      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>,      sub: 'personal best' },
            { label: 'Accuracy',     value: `${stats.avg_accuracy || 0}%`, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>, sub: 'avg accuracy' },
            { label: 'Day Streak',   value: streak,                     icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>, sub: maxStreak > 0 ? `Best: ${maxStreak}d` : '—' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ color: 'var(--orange-500)', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.sub && <div className="stat-sub">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── STREAK CALENDAR AFTER STATS ── */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="dash-section-head" style={{ marginBottom: '14px', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle', marginRight: '8px', color: 'var(--orange-500)'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Study Streak Calendar
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>
                Track daily activity and quickly see whether your study habit is consistent.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="level-tag" style={{ background: 'var(--orange-100)', color: 'var(--orange-700)', border: '1px solid var(--orange-200)' }}>
                Current: {streak} days
              </span>
              <span className="level-tag" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                Best: {maxStreak} days
              </span>
            </div>
          </div>
          <StreakCalendar />
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="dash-two-col" style={{ marginTop: '24px' }}>

          {/* LEFT COLUMN */}
          <div className="dash-col-main">

            {/* Subjects For You — interest grouped */}
            {(() => {
              const interests = uData.interests || [];
              const hasInterests = interests.length > 0 &&
                interests.some(i => INTEREST_TO_SUBJECTS[i]);

              if (!hasInterests) {
                /* ── No interests → show popular 8-card fallback ── */
                return (
                  <div className="card">
                    <div className="dash-section-head" style={{ marginBottom: '18px' }}>
                      <h2 style={{ margin: 0 }}>
                        
                        Popular Subjects
                      </h2>
                      <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}
                        onClick={() => navigate('/subjects')}>See All →</button>
                    </div>
                    <div className="quick-subject-grid">
                      {POPULAR_SUBJECTS.map(subj => (
                        <div key={subj} className="quick-subject-card" onClick={() => navigate('/subjects')}>
                          <img src={getSubjectImage(subj)} alt={subj}
                            className="quick-subject-img"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_SUBJECT_IMAGE; }} />
                          <span className="quick-subject-name">{subj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              /* ── Has interests → show per-interest subject sections ── */
              return (
                <div className="card">
                  {/* Header */}
                  <div className="dash-section-head" style={{ marginBottom: '4px' }}>
                    <div>
                      <h2 style={{ margin: 0 }}>
                        
                        Subjects For You
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>
                        Based on your interests: {interests.slice(0, 3).map(i => `"${i}"`).join(', ')}
                        {interests.length > 3 && ` +${interests.length - 3} more`}
                      </p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}
                      onClick={() => navigate('/subjects')}>Browse All →</button>
                  </div>

                  {/* One section per interest */}
                  {interests.map(interest => {
                    const subjects = INTEREST_TO_SUBJECTS[interest];
                    if (!subjects) return null;
                    return (
                      <div key={interest}>
                        {/* Interest label row */}
                        <div className="level-path-header">
                          <span style={{
                            background: 'var(--grad)', color: 'white',
                            borderRadius: 'var(--r-full)', padding: '4px 14px',
                            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                          }}>{interest}</span>
                          <div style={{ flex: 1, height: '1.5px', background: 'var(--border)', borderRadius: '2px' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {subjects.filter(s => !COMING_SOON.has(s)).length} available
                            {subjects.filter(s => COMING_SOON.has(s)).length > 0 &&
                              ` · ${subjects.filter(s => COMING_SOON.has(s)).length} coming soon`}
                          </span>
                        </div>

                        {/* Subject cards for this interest */}
                        <div className="quick-subject-grid" style={{ marginBottom: '4px' }}>
                          {subjects.map(subj => {
                            const isComingSoon = COMING_SOON.has(subj);
                            return (
                              <div key={subj}
                                className="quick-subject-card"
                                onClick={isComingSoon ? undefined : () => navigate('/subjects')}
                                style={{
                                  opacity:        isComingSoon ? 0.55 : 1,
                                  cursor:         isComingSoon ? 'default' : 'pointer',
                                  borderStyle:    isComingSoon ? 'dashed' : 'solid',
                                  pointerEvents:  isComingSoon ? 'none' : 'auto',
                                }}
                              >
                                {isComingSoon && (
                                  <span style={{
                                    position: 'absolute', top: '5px', right: '5px',
                                    background: '#6B7280', color: 'white',
                                    borderRadius: '4px', fontSize: '8px',
                                    fontWeight: 800, padding: '2px 5px', lineHeight: 1.4,
                                    letterSpacing: '0.3px',
                                  }}>SOON</span>
                                )}
                                <img
                                  src={getSubjectImage(subj)}
                                  alt={subj}
                                  className="quick-subject-img"
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_SUBJECT_IMAGE; }}
                                />
                                <span className="quick-subject-name">{subj}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Score Trend */}
            {trend.length > 0 && (
              <div className="card">
                <div className="dash-section-head">
                  <h2 style={{ margin: 0 }}>
                    
                    Score Trend
                  </h2>
                  <span className="chart-subtitle">Last {trend.length} tests</span>
                </div>
                <ScoreTrendChart trend={trend} />
              </div>
            )}

            {/* Achievements */}
            {badges.length > 0 && (
              <div className="card">
                <div className="dash-section-head">
                  <h2 style={{ margin: 0 }}>
                    
                    Achievements
                  </h2>
                  <span className="badge-count">{badges.length} earned</span>
                </div>
                <div className="badges-grid">
                  {badges.map(b => (
                    <div key={b.id} className="badge-chip" title={b.desc}>
                      <span className="badge-icon">{b.icon}</span>
                      <span className="badge-name">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="dash-col-side">

            {/* Subject Mastery */}
            {Object.keys(subject_best).length > 0 && (
              <div className="card">
                <h2 style={{ marginBottom: '8px' }}>
                  
                  Subject Mastery
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={Object.entries(subject_best).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, v]) => ({
                    subject: s.length > 7 ? s.slice(0, 6) + '…' : s, value: v,
                  }))}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Radar name="Score" dataKey="value" stroke="#F97316" fill="#F97316" fillOpacity={0.18} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Tests */}
            <div className="card">
              <div className="dash-section-head" style={{ marginBottom: '14px' }}>
                <h2 style={{ margin: 0 }}>
                  
                  Recent Tests
                </h2>
                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '11px' }}
                  onClick={() => setActiveTab('history')}>
                  View All
                </button>
              </div>

              {test_history.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 10px' }}>
                  <p>No tests yet. <a href="/subjects" style={{ color: 'var(--orange-600)', fontWeight: 700 }}>Start one now →</a></p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {test_history.slice(0, 5).map(t => (
                    <div key={t.test_id} className="recent-test-row" onClick={() => t.status === 'completed' && navigate(`/results/${t.test_id}`)}>
                      <img
                        src={getSubjectImage(t.subject)}
                        alt={t.subject}
                        style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '8px', padding: '6px', background: 'white', flexShrink: 0 }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_SUBJECT_IMAGE; }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{t.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(t.started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {t.capability_score > 0 && (
                          <span className="score-pill" style={{ fontSize: '12px' }}>{t.capability_score}</span>
                        )}
                        <span style={statusStyle(t.status)}>{t.status === 'in_progress' ? 'ongoing' : t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Quick View */}
            <div className="card">
              <h2 style={{ marginBottom: '16px' }}>
                
                Profile
              </h2>
              <div className="profile-mini">
                <div className="profile-avatar">{(uData.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{uData.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{uData.email}</div>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`level-tag level-${level.toLowerCase()}`}>{level}</span>
                  </div>
                </div>
              </div>
              {(uData.interests || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                  {(uData.interests || []).slice(0, 4).map(i => (
                    <span key={i} style={{
                      background: 'var(--orange-100)', color: 'var(--orange-700)',
                      borderRadius: 'var(--r-full)', padding: '3px 10px',
                      fontSize: '11px', fontWeight: 600, border: '1px solid var(--orange-200)',
                    }}>{i}</span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── FULL HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="dash-section-head">
              <h2 style={{ margin: 0 }}>All Test History</h2>
              <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setActiveTab('overview')}>← Back</button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table className="history-table">
                <thead>
                  <tr>{['Subject', 'Date', 'Status', 'Score', 'Accuracy', 'Correct', ''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {test_history.map(test => (
                    <tr key={test.test_id}>
                      <td style={{ fontWeight: 600 }}>{test.subject}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(test.started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td><span className={`status-pill status-${test.status}`}>{test.status}</span></td>
                      <td>{test.capability_score > 0 ? <span className="score-pill">{test.capability_score}</span> : '—'}</td>
                      <td>{test.accuracy > 0 ? `${test.accuracy}%` : '—'}</td>
                      <td>{test.correct_answers > 0 ? `${test.correct_answers}/${test.total_questions}` : '—'}</td>
                      <td>{test.status === 'completed' && (
                        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }}
                          onClick={() => navigate(`/results/${test.test_id}`)}>View →</button>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
