import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import useBehaviorTracking from '../utils/useBehaviorTracking';

/* ── Subject metadata with Icons8 PNG icons ───────────── */
const SUBJECT_META = {
  'Cloud Computing':  {
    icon: 'https://img.icons8.com/fluency/96/cloud.png',
    category: 'Systems',      desc: 'Virtualization, AWS, Azure & cloud architecture fundamentals.',
  },
  'C Programming':    {
    icon: 'https://img.icons8.com/fluency/96/c-programming.png',
    category: 'Programming',  desc: 'Memory, pointers, data types, and systems-level programming.',
  },
  'AT':               {
    icon: 'https://img.icons8.com/fluency/96/flow-chart.png',
    category: 'Theory',       desc: 'Automata theory, formal languages, and Turing machines.',
  },
  'Python':           {
    icon: 'https://img.icons8.com/color/96/python--v1.png',
    category: 'Programming',  desc: 'OOP, modules, data structures and scripting in Python.',
  },
  'Algorithm':        {
    icon: 'https://img.icons8.com/fluency/96/sorting-arrows.png',
    category: 'Core CS',      desc: 'Sorting, searching, dynamic programming and complexity.',
  },
  'CN':               {
    icon: 'https://img.icons8.com/fluency/96/connected.png',
    category: 'Networking',   desc: 'TCP/IP, OSI model, routing protocols and subnetting.',
  },
  'CSCL':             {
    icon: 'https://img.icons8.com/fluency/96/classroom.png',
    category: 'Theory',       desc: 'Computer science and collaborative learning concepts.',
  },
  'Data Structures':  {
    icon: 'https://img.icons8.com/fluency/96/data-sheet.png',
    category: 'Core CS',      desc: 'Arrays, trees, graphs, heaps and efficient algorithms.',
  },
  'DBMS':             {
    icon: 'https://img.icons8.com/fluency/96/database.png',
    category: 'Databases',    desc: 'SQL, normalization, transactions and query optimization.',
  },
  'DCN':              {
    icon: 'https://img.icons8.com/fluency/96/satellite.png',
    category: 'Networking',   desc: 'Digital communication, modulation and signal encoding.',
  },
  'DMS':              {
    icon: 'https://img.icons8.com/fluency/96/math.png',
    category: 'Mathematics',  desc: 'Sets, relations, graphs, logic and combinatorics.',
  },
  'DSMP':             {
    icon: 'https://img.icons8.com/fluency/96/combo-chart.png',
    category: 'Data Science',  desc: 'Statistics, probability and mathematical foundations of ML.',
  },
  'IoT':              {
    icon: 'https://img.icons8.com/fluency/96/internet-of-things.png',
    category: 'Systems',       desc: 'Sensors, embedded systems, protocols and smart devices.',
  },
  'Java':             {
    icon: 'https://img.icons8.com/color/96/java-coffee-cup-logo--v1.png',
    category: 'Programming',   desc: 'OOP, JVM, collections, threading and enterprise Java.',
  },
  'Maths':            {
    icon: 'https://img.icons8.com/fluency/96/calculator.png',
    category: 'Mathematics',   desc: 'Calculus, linear algebra, and numerical methods for CS.',
  },
  'ML':               {
    icon: 'https://img.icons8.com/fluency/96/machine-learning.png',
    category: 'Data Science',  desc: 'Supervised learning, neural networks & model evaluation.',
  },
  'OOP':              {
    icon: 'https://img.icons8.com/fluency/96/object.png',
    category: 'Programming',   desc: 'Inheritance, polymorphism, design patterns and abstraction.',
  },
  'OS':               {
    icon: 'https://img.icons8.com/fluency/96/workstation.png',
    category: 'Systems',       desc: 'Processes, memory management, file systems and scheduling.',
  },
  'WebTech':          {
    icon: 'https://img.icons8.com/fluency/96/web.png',
    category: 'Programming',   desc: 'HTML, CSS, JavaScript, REST APIs and full-stack concepts.',
  },
};

const CATEGORIES = ['All', 'Programming', 'Core CS', 'Systems', 'Networking', 'Databases', 'Data Science', 'Mathematics', 'Theory'];

const DIFF_OPTIONS = [
  { value: 'easy',       label: '🟢 Easy' },
  { value: 'moderate-1', label: '🟡 Moderate I' },
  { value: 'moderate-2', label: '🟠 Moderate II' },
  { value: 'hard',       label: '🔴 Hard' },
];

/* ── Course Card ──────────────────────────────────────── */
const CourseCard = ({ subject, meta, onTest, onPractice }) => (
  <div className="course-card">
    <div className="course-card-banner">
      <img
        src={meta.icon}
        alt={subject}
        className="course-card-img"
        onError={(e) => { e.target.src = 'https://img.icons8.com/fluency/96/book.png'; }}
      />
      <span className="course-category-pill">{meta.category}</span>
    </div>
    <div className="course-card-body">
      <h3 className="course-title">{subject}</h3>
      <p className="course-desc">{meta.desc}</p>
    </div>
    <div className="course-card-footer">
      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', fontSize: '13px' }}
        onClick={() => onTest(subject)}>
        Take Test →
      </button>
      <button className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '13px' }}
        onClick={() => onPractice(subject)}
        title="Practice Mode">
        Practice
      </button>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────── */
const SubjectSelection = ({ user }) => {
  useBehaviorTracking({ topic: 'Subject Catalog', action: 'browse_catalog' });
  const [subjects,  setSubjects]  = useState([]);
  const [filter,    setFilter]    = useState('All');
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [config,    setConfig]    = useState({ num_questions: 10, starting_difficulty: 'easy', time_limit: 600 });
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal     = (subject) => { setConfig({ num_questions: 10, starting_difficulty: 'easy', time_limit: 600 }); setModal(subject); };
  const startTest     = () => { sessionStorage.setItem('testConfig', JSON.stringify(config)); navigate(`/test/${encodeURIComponent(modal)}`); setModal(null); };
  const startPractice = (subject) => navigate(`/practice/${encodeURIComponent(subject)}`);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 3) {
      setResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/questions/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = subjects.filter(s => filter === 'All' || SUBJECT_META[s]?.category === filter);

  if (loading) return <div className="loading">Loading subjects…</div>;

  return (
    <div className="app-layout" style={{ paddingTop: '64px' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 60%, #FFF7ED 100%)',
        borderBottom: '1px solid var(--border-o)',
        padding: '48px 0 36px',
      }}>
        <div className="container" style={{ paddingTop: 0, paddingBottom: 0, maxWidth: '1100px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                📚 Course Catalog
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                Explore CSE Subjects
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '15px', maxWidth: '520px' }}>
                {subjects.length} subjects · AI-adaptive questions · Proctored exams · Free NPTEL & Coursera recommendations
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={() => navigate('/test/setup-mixed')}>
                  Take Mixed Test →
                </button>
                <button className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '13px', background: 'var(--orange-50)', color: 'var(--orange-600)', borderColor: 'var(--orange-200)', whiteSpace: 'nowrap' }} onClick={() => navigate('/explain')}>
                  🎙️ AI Explanation Mode
                </button>
                <button className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '13px', background: 'var(--orange-50)', color: 'var(--orange-600)', borderColor: 'var(--orange-200)', whiteSpace: 'nowrap' }} onClick={() => navigate('/project')}>
                  💻 Mini Code Project
                </button>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                  <input type="text"
                    placeholder="Search specific questions or topics..."
                    value={search} onChange={handleSearch}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                      fontSize: '13px', outline: 'none'
                    }}
                  />
                  {results.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                      maxHeight: '300px', overflowY: 'auto', zIndex: 999
                    }}>
                      {results.map(r => (
                        <div key={r._id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => { openModal(r.subject); setSearch(''); setResults([]); }}>
                          <div style={{ fontSize: '11px', color: 'var(--orange-600)', fontWeight: 700 }}>{r.subject} · {r.difficulty}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text)' }}>{r.question.length > 80 ? r.question.slice(0, 80) + '...' : r.question}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              background: 'white', borderRadius: '14px', padding: '18px 28px',
              border: '1.5px solid var(--border-o)', textAlign: 'center',
              boxShadow: '0 4px 16px rgba(249,115,22,0.1)',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--orange-600)', lineHeight: 1 }}>{subjects.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Subjects</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTERS ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'white', position: 'sticky', top: '64px', zIndex: 100 }}>
        <div className="container" style={{ paddingTop: '14px', paddingBottom: '14px', maxWidth: '1100px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const count = cat === 'All' ? subjects.length : subjects.filter(s => SUBJECT_META[s]?.category === cat).length;
              if (count === 0 && cat !== 'All') return null;
              const active = filter === cat;
              return (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  padding: '7px 16px', borderRadius: 'var(--r-full)',
                  border: `2px solid ${active ? 'var(--orange-500)' : 'var(--border)'}`,
                  background: active ? 'var(--grad)' : 'white',
                  color:      active ? 'white' : 'var(--text-2)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font)', transition: 'all 0.18s',
                }}>
                  {cat} <span style={{ opacity: 0.75 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── COURSE GRID ── */}
      <div className="container" style={{ maxWidth: '1100px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">No subjects in this category yet.</div>
        ) : (
          <div className="course-grid">
            {filtered.map(subject => (
              <CourseCard
                key={subject}
                subject={subject}
                meta={SUBJECT_META[subject] || {
                  icon: 'https://img.icons8.com/fluency/96/book.png',
                  category: 'General', desc: 'Core computer science concepts.',
                }}
                onTest={openModal}
                onPractice={startPractice}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── CONFIG MODAL ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={SUBJECT_META[modal]?.icon || 'https://img.icons8.com/fluency/96/book.png'}
                  alt={modal} style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Configure Test</div>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>{modal}</h2>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="config-group">
              <label>Number of Questions</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[5, 10, 15, 20].map(n => (
                  <button key={n}
                    onClick={() => setConfig(c => ({ ...c, num_questions: n }))}
                    className={`btn ${config.num_questions === n ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 22px' }}>
                    {n} Qs
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <label>Starting Difficulty</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {DIFF_OPTIONS.map(d => (
                  <button key={d.value}
                    onClick={() => setConfig(c => ({ ...c, starting_difficulty: d.value }))}
                    className={`btn ${config.starting_difficulty === d.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <label>Time Limit</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { value: 0,    label: '∞ No Limit' },
                  { value: 300,  label: '5 min' },
                  { value: 600,  label: '10 min' },
                  { value: 900,  label: '15 min' },
                  { value: 1800, label: '30 min' },
                ].map(t => (
                  <button key={t.value}
                    onClick={() => setConfig(c => ({ ...c, time_limit: t.value }))}
                    className={`btn ${config.time_limit === t.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-proctor-notice">
              🔒 <strong>Proctoring Active:</strong> Tab switching, copy-paste, and right-click are disabled. Any violation terminates your test immediately.
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: '15px' }} onClick={startTest}>
                Start Test →
              </button>
              <button className="btn btn-secondary" style={{ padding: '12px 20px' }} onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSelection;
