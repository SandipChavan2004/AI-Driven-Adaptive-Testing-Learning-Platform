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
const ICON_MAP = {
  'Cloud Computing': 'https://img.icons8.com/fluency/96/cloud.png',
  'C Programming':   'https://img.icons8.com/fluency/96/c-programming.png',
  'AT':              'https://img.icons8.com/fluency/96/flow-chart.png',
  'Python':          'https://img.icons8.com/color/96/python--v1.png',
  'Algorithm':       'https://img.icons8.com/fluency/96/sorting-arrows.png',
  'CN':              'https://img.icons8.com/fluency/96/connected.png',
  'CSCL':            'https://img.icons8.com/fluency/96/classroom.png',
  'Data Structures': 'https://img.icons8.com/fluency/96/data-sheet.png',
  'DBMS':            'https://img.icons8.com/fluency/96/database.png',
  'DCN':             'https://img.icons8.com/fluency/96/satellite.png',
  'DMS':             'https://img.icons8.com/fluency/96/math.png',
  'DSMP':            'https://img.icons8.com/fluency/96/combo-chart.png',
  'IoT':             'https://img.icons8.com/fluency/96/internet-of-things.png',
  'Java':            'https://img.icons8.com/color/96/java-coffee-cup-logo--v1.png',
  'Maths':           'https://img.icons8.com/fluency/96/calculator.png',
  'ML':              'https://img.icons8.com/fluency/96/machine-learning.png',
  'OOP':             'https://img.icons8.com/fluency/96/object.png',
  'OS':              'https://img.icons8.com/fluency/96/workstation.png',
  'WebTech':         'https://img.icons8.com/fluency/96/web.png',
  /* ── Icons for coming-soon subjects ── */
  'JavaScript':         'https://img.icons8.com/color/96/javascript--v1.png',
  'Android Dev':        'https://img.icons8.com/color/96/android-os.png',
  'Cyber Security':     'https://img.icons8.com/fluency/96/cyber-security.png',
  'DevOps':             'https://img.icons8.com/fluency/96/devops.png',
  'Blockchain':         'https://img.icons8.com/fluency/96/blockchain.png',
  'Game Development':   'https://img.icons8.com/fluency/96/game-controller.png',
  'UI/UX Design':       'https://img.icons8.com/fluency/96/design.png',
  'Software Engineering': 'https://img.icons8.com/fluency/96/source-code.png',
  'default':            'https://img.icons8.com/fluency/96/book.png',
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
            <div className="dash-hero-greeting">{t(getGreeting())}, {firstName}! 👋</div>
            <h1 className="dash-hero-title">
              {streak > 0
                ? `You're on a ${streak}-day streak. Keep it up!`
                : t('Ready to start')}
            </h1>
            <div className="dash-hero-meta">
              <span className={`level-tag level-${level.toLowerCase()}`}>{level}</span>
              {streak > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                  <img src="https://img.icons8.com/fluency/24/fire-element.png" alt="fire" style={{ width: '18px', height: '18px' }} />
                  {streak} day streak
                </span>
              )}
              {dueReviews > 0 && (
                <span onClick={() => navigate('/practice/Mixed')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  <img src="https://img.icons8.com/fluency/24/box-important--v1.png" alt="review" style={{ width: '16px', height: '16px' }} />
                  {dueReviews} Reviews Due
                </span>
              )}
            </div>
          </div>
          <div className="dash-hero-right" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/challenges')} style={{ width: '100%', background: 'var(--orange-400)', color: 'white', border: 'none', boxShadow: 'var(--shadow-md)' }}>
              🔥 Daily Challenge
            </button>
            <button className="btn btn-white" onClick={() => navigate('/subjects')} style={{ width: '100%' }}>
              <img src="/logo.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px' }} />
              Browse Subjects
            </button>
            <button className="btn btn-white" onClick={() => navigate('/resume')} style={{ width: '100%' }}>
              <img src="https://img.icons8.com/fluency/24/resume.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px' }} />
              Resume AI
            </button>
          </div>
          {/* decorative circles */}
          <div className="hero-circle hero-circle-1" />
          <div className="hero-circle hero-circle-2" />
        </div>

        {/* ── STATS ROW ── */}
        <div className="stats-row" style={{ marginTop: '24px' }}>
          {[
            { label: t('Tests Taken'),  value: stats.completed_tests || 0, icon: 'https://img.icons8.com/fluency/96/test-passed.png', sub: 'total' },
            { label: t('Average Score'),    value: stats.avg_score || 0,       icon: 'https://img.icons8.com/fluency/96/combo-chart.png', sub: 'out of 100' },
            { label: 'Best Score',   value: stats.best_score || 0,      icon: 'https://img.icons8.com/fluency/96/trophy.png',      sub: 'personal best' },
            { label: 'Accuracy',     value: `${stats.avg_accuracy || 0}%`, icon: 'https://img.icons8.com/fluency/96/target.png', sub: 'avg accuracy' },
            { label: 'Day Streak',   value: streak,                     icon: 'https://img.icons8.com/fluency/96/fire-element.png', sub: maxStreak > 0 ? `Best: ${maxStreak}d` : '—' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">
                <img src={s.icon} alt={s.label} style={{ width: '38px', height: '38px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
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
                <img src="https://img.icons8.com/fluency/24/calendar.png" alt=""
                  style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
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
                        <img src="https://img.icons8.com/fluency/24/books.png" alt=""
                          style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
                        Popular Subjects
                      </h2>
                      <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}
                        onClick={() => navigate('/subjects')}>See All →</button>
                    </div>
                    <div className="quick-subject-grid">
                      {POPULAR_SUBJECTS.map(subj => (
                        <div key={subj} className="quick-subject-card" onClick={() => navigate('/subjects')}>
                          <img src={ICON_MAP[subj] || ICON_MAP.default} alt={subj}
                            className="quick-subject-img"
                            onError={(e) => { e.target.src = ICON_MAP.default; }} />
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
                        <img src="https://img.icons8.com/fluency/24/star.png" alt=""
                          style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                          onError={(e) => { e.target.style.display = 'none'; }} />
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
                                  src={ICON_MAP[subj] || ICON_MAP.default}
                                  alt={subj}
                                  className="quick-subject-img"
                                  onError={(e) => { e.target.src = ICON_MAP.default; }}
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
                    <img src="https://img.icons8.com/fluency/24/combo-chart.png" alt="" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
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
                    <img src="https://img.icons8.com/fluency/24/trophy.png" alt="" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
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
                  <img src="https://img.icons8.com/fluency/24/graduation-cap.png" alt="" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
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
                  <img src="https://img.icons8.com/fluency/24/test-passed.png" alt="" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
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
                        src={ICON_MAP[t.subject] || ICON_MAP.default}
                        alt={t.subject}
                        style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
                        onError={(e) => { e.target.src = ICON_MAP.default; }}
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
                <img src="https://img.icons8.com/fluency/24/user.png" alt="" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} />
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
