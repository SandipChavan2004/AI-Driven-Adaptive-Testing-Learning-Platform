import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const API = 'http://localhost:5000';

/* ── helpers ─────────────────────────────────────────── */
const token = () => localStorage.getItem('token');
const authHdr = () => ({ Authorization: `Bearer ${token()}` });

const SEVERITY_COLOR = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const VERDICT_BG = {
  Excellent: '#dcfce7', Good: '#dbeafe',
  Average: '#fef9c3', 'Needs Improvement': '#fee2e2',
};
const VERDICT_COLOR = {
  Excellent: '#16a34a', Good: '#1d4ed8',
  Average: '#854d0e', 'Needs Improvement': '#dc2626',
};

const ScoreRing = ({ score, size = 90, stroke = 8, color = '#F97316' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fill: 'var(--text)', fontSize: size * 0.22, fontWeight: 800 }}>
        {score}
      </text>
    </svg>
  );
};

const ProgressBar = ({ value, color = '#F97316' }) => (
  <div style={{ background: 'var(--border)', borderRadius: 99, height: 8, overflow: 'hidden', flex: 1 }}>
    <div style={{
      width: `${value}%`, background: color, height: '100%', borderRadius: 99,
      transition: 'width 0.8s ease'
    }} />
  </div>
);

const Tag = ({ label, color = 'var(--orange-100)', textColor = 'var(--orange-700)', border = 'var(--orange-200)' }) => (
  <span style={{
    background: color, color: textColor, border: `1px solid ${border}`,
    borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 600,
    display: 'inline-block'
  }}>{label}</span>
);

const Icon = ({ name, size = 22, color = 'currentColor', style = {} }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { verticalAlign: 'middle', ...style },
    'aria-hidden': true,
  };

  const paths = {
    resume: (
      <>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"></path>
        <path d="M14 2v5h5"></path>
        <path d="M9 13h6"></path>
        <path d="M9 17h4"></path>
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4"></path>
        <path d="M7 9l5-5 5 5"></path>
        <path d="M5 20h14"></path>
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
      </>
    ),
    skills: (
      <>
        <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"></path>
      </>
    ),
    soft: (
      <>
        <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3z"></path>
        <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z"></path>
        <path d="M2 20c0-2.5 2.5-4 6-4"></path>
        <path d="M22 20c0-2.5-2.5-4-6-4"></path>
      </>
    ),
    gap: (
      <>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
      </>
    ),
    tip: (
      <>
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M8.5 14.5A6 6 0 1 1 15.5 14c-.8.7-1.5 1.7-1.5 3h-4c0-1.2-.6-2-1.5-2.5z"></path>
      </>
    ),
    role: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2"></rect>
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
        <path d="M8 13h8"></path>
      </>
    ),
    resources: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </>
    ),
    interview: (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <path d="M12 19v4"></path>
      </>
    ),
    check: (
      <path d="M20 6 9 17l-5-5"></path>
    ),
  };

  return <svg {...common}>{paths[name] || paths.resume}</svg>;
};

/* ── STAGE 1: Upload ─────────────────────────────────── */
const UploadStage = ({ onAnalysed }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const ok = f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx');
    if (!ok) { setError('Only PDF or DOCX files are supported.'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return; }
    setError(''); setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError('');
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const res = await axios.post(`${API}/api/resume/upload`, fd, {
        headers: { ...authHdr(), 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 60)),
      });
      setProgress(100);
      setTimeout(() => onAnalysed(res.data.analysis), 500);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ marginBottom: 12 }}>
          <Icon name="resume" size={48} color="var(--orange-600)" />
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Upload Your Resume</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Our AI will analyse your resume, find skill gaps, suggest learning resources,<br />
          and conduct a personalised mock interview.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !file && inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? '#F97316' : file ? '#16a34a' : 'var(--border)'}`,
          borderRadius: 16, padding: '48px 32px', textAlign: 'center',
          cursor: file ? 'default' : 'pointer', transition: 'all 0.2s',
          background: dragging ? 'var(--orange-50)' : file ? '#f0fdf4' : 'var(--surface)',
          position: 'relative'
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" hidden
          onChange={(e) => handleFile(e.target.files[0])} />

        {file ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <Icon name="file" size={40} color="#16a34a" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{file.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <button onClick={() => setFile(null)} style={{
              marginTop: 12, background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '4px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)'
            }}>Change File</button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <Icon name="upload" size={48} color="#F97316" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Drag & drop your resume here</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              or click to browse · PDF or DOCX · Max 5 MB
            </div>
          </>
        )}
      </div>

      {/* Progress */}
      {uploading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>{progress < 60 ? 'Uploading…' : progress < 100 ? 'Analysing with AI…' : 'Done!'}</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      )}

      {error && (
        <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', color: '#dc2626', fontSize: 13 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: '100%', marginTop: 24, padding: '14px',
          background: file && !uploading ? 'var(--grad)' : 'var(--border)',
          color: 'white', border: 'none', borderRadius: 12, fontSize: 15,
          fontWeight: 700, cursor: file && !uploading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s', boxShadow: file ? 'var(--shadow-md)' : 'none'
        }}
      >
        {uploading ? <span>Analysing Resume…</span> : <span><Icon name="upload" size={16} style={{ marginRight: 8 }} />Analyse My Resume</span>}
      </button>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:6, color:"#64748B"}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Your resume is processed securely and never shared.
      </p>
    </div>
  );
};

/* ── STAGE 2: Analysis Dashboard ─────────────────────── */
const AnalysisStage = ({ analysis, onNext }) => {
  const score = analysis.resume_score || 0;
  const breakdown = analysis.score_breakdown || {};
  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';

  return (
    <div>
      {/* Hero */}
      <div className="dash-hero-card" style={{ marginBottom: 24 }}>
        <div className="dash-hero-left">
          <div className="dash-hero-greeting">Resume Analysis Complete <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginLeft:8, color:"#10B981"}}><path d="M12 2l3 6 6 1-4.5 4.5 1.5 6-6-3.5L6 20l1.5-6L3 9l6-1z"></path></svg></div>
          <h1 className="dash-hero-title" style={{ fontSize: 22 }}>{analysis.name || 'Your Resume'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: 0 }}>{analysis.summary}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ScoreRing score={score} size={100} color={scoreColor} />
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700 }}>Resume Score</span>
        </div>
        <div className="hero-circle hero-circle-1" />
        <div className="hero-circle hero-circle-2" />
      </div>

      <div className="dash-two-col">
        {/* LEFT */}
        <div className="dash-col-main">

          {/* Skills */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>
              <Icon name="skills" size={22} color="#F97316" style={{ marginRight: 8 }} />
              Technical Skills
            </h2>
            {analysis.strong_skills?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>STRONGEST SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.strong_skills.map(s => (
                    <Tag key={s} label={s} color="#dcfce7" textColor="#16a34a" border="#bbf7d0" />
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>ALL SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(analysis.skills || []).map(s => <Tag key={s} label={s} />)}
              {!analysis.skills?.length && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No skills detected</span>}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>
              <Icon name="soft" size={22} color="#0369a1" style={{ marginRight: 8 }} />
              Soft Skills
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(analysis.soft_skills || []).map(s => (
                <Tag key={s} label={s} color="#e0f2fe" textColor="#0369a1" border="#bae6fd" />
              ))}
              {!analysis.soft_skills?.length && (
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No clear soft skills detected. Add teamwork, communication, leadership, or ownership evidence.
                </span>
              )}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>
              <Icon name="gap" size={22} color="#d97706" style={{ marginRight: 8 }} />
              Skill Gaps to Address
            </h2>
            {(analysis.skill_gaps || []).map((gap, i) => {
              const g = typeof gap === 'string' ? { skill: gap, severity: 'Medium', reason: '' } : gap;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: i < analysis.skill_gaps.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{
                    minWidth: 68, padding: '2px 8px', borderRadius: 99,
                    background: SEVERITY_COLOR[g.severity] + '20',
                    color: SEVERITY_COLOR[g.severity], fontSize: 11, fontWeight: 700, textAlign: 'center'
                  }}>{g.severity}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{g.skill}</div>
                    {g.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{g.reason}</div>}
                  </div>
                </div>
              );
            })}
            {!analysis.skill_gaps?.length && <p style={{ color: 'var(--text-muted)' }}>No significant gaps found.</p>}
          </div>

          {/* Soft Skill Gaps */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}><Icon name="gap" size={22} color="#dc2626" style={{ marginRight: 8 }} />Soft Skill Gaps</h2>
            {(analysis.soft_skill_gaps || []).map((gap, i) => {
              const g = typeof gap === 'string' ? { skill: gap, severity: 'Medium', reason: '' } : gap;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: i < analysis.soft_skill_gaps.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{
                    minWidth: 68, padding: '2px 8px', borderRadius: 99,
                    background: SEVERITY_COLOR[g.severity] + '20',
                    color: SEVERITY_COLOR[g.severity], fontSize: 11, fontWeight: 700, textAlign: 'center'
                  }}>{g.severity}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{g.skill}</div>
                    {g.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{g.reason}</div>}
                  </div>
                </div>
              );
            })}
            {!analysis.soft_skill_gaps?.length && <p style={{ color: 'var(--text-muted)' }}>No major soft-skill gaps found.</p>}
          </div>

          {/* Improvements */}
          {analysis.top_improvements?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}><Icon name="tip" size={24} color="#F59E0B" style={{ marginRight: 8 }} /> Top Improvement Tips</h2>
              {analysis.top_improvements.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < analysis.top_improvements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ minWidth: 24, height: 24, background: 'var(--orange-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--orange-700)' }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{tip}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="dash-col-side">

          {/* Score Breakdown */}
          <div className="card">
            <h2 style={{ marginBottom: 16 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F97316"}}><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Score Breakdown</h2>
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ color: 'var(--orange-600)' }}>{val}/100</span>
                </div>
                <ProgressBar value={val} />
              </div>
            ))}
          </div>

          {/* Target Roles */}
          {analysis.target_roles?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}><Icon name="role" size={24} color="#F97316" style={{ marginRight: 8 }} /> Suitable Roles</h2>
              {analysis.target_roles.map((role, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < analysis.target_roles.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{ fontSize: 18 }}>{"Rank " + (i+1)}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{role}</span>
                </div>
              ))}
            </div>
          )}

          {/* Learning Path */}
          {analysis.learning_path?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>Learning Plan</h2>
              {analysis.learning_path.map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < analysis.learning_path.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>Week {item.week || i + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--orange-600)', fontWeight: 700 }}>{item.focus}</span>
                  </div>
                  {(item.goals || []).slice(0, 3).map((goal, j) => (
                    <div key={j} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>- {goal}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {analysis.education?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#8B5CF6"}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Education</h2>
              {analysis.education.map((edu, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < analysis.education.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{edu.degree}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{edu.institution} · {edu.year}</div>
                </div>
              ))}
            </div>
          )}

          {/* Experience */}
          {analysis.experience?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#059669"}}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> Experience</h2>
              {analysis.experience.map((exp, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < analysis.experience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{exp.role}</div>
                  <div style={{ fontSize: 12, color: 'var(--orange-600)', marginTop: 2 }}>{exp.company} · {exp.duration}</div>
                  {exp.highlights?.slice(0, 2).map((h, j) => (
                    <div key={j} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>• {h}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '14px' }} onClick={() => onNext('resources')}>
          Get Learning Resources →
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => onNext('interview')}>
          Start Mock Interview →
        </button>
      </div>
    </div>
  );
};

/* ── STAGE 3: Resources ──────────────────────────────── */
const ResourcesStage = ({ analysis, onNext }) => {
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.post(`${API}/api/resume/resources`,
          {
            skill_gaps: analysis.skill_gaps,
            soft_skill_gaps: analysis.soft_skill_gaps,
            skills: analysis.skills,
            recommended_courses: analysis.recommended_courses
          },
          { headers: authHdr() }
        );
        setResources(res.data.resources);
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load resources.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [analysis]);

  const resourceTabs = [
    { id: 'videos', label: 'Videos', count: resources?.videos?.length || resources?.youtube?.length || 0 },
    { id: 'docs', label: 'Docs', count: resources?.docs?.length || 0 },
    { id: 'courses', label: 'Courses', count: resources?.courses?.length || resources?.coursera?.length || 0 },
    { id: 'soft', label: 'Soft Skills', count: resources?.soft_skills?.length || 0 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F97316"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> Personalised Learning Resources</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
          Based on your skill gaps — curated resources to help you level up.
        </p>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '60px 0' }}>Finding best resources for you…</div>
      ) : error ? (
        <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12, color: '#dc2626' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}</div>
      ) : (
        <>
          {/* Skill Gap Pills */}
          {analysis.skill_gaps?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>TARGETING GAPS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {analysis.skill_gaps.slice(0, 6).map((g, i) => {
                  const name = typeof g === 'string' ? g : g.skill;
                  const sev = typeof g === 'string' ? 'Medium' : g.severity;
                  return <Tag key={i} label={name}
                    color={SEVERITY_COLOR[sev] + '18'} textColor={SEVERITY_COLOR[sev]} border={SEVERITY_COLOR[sev] + '40'} />;
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {resourceTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px', borderRadius: 99,
                  background: activeTab === tab.id ? 'var(--orange-500)' : 'var(--surface)',
                  color: activeTab === tab.id ? 'white' : 'var(--text)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                {tab.label} <span style={{ opacity: 0.7 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Videos */}
          {activeTab === 'videos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {(resources.videos || resources.youtube || []).map((v, i) => (
                <a key={i} href={v.url} target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}>
                    <div style={{ position: 'relative' }}>
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title} style={{ width: '100%', display: 'block', height: 150, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orange-100)', color: 'var(--orange-700)', fontWeight: 800 }}>
                          {v.skill}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: '#F97316', color: 'white', borderRadius: 99,
                        padding: '2px 10px', fontSize: 11, fontWeight: 700
                      }}>{v.skill}</div>
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity 0.2s'
                      }} className="yt-play-overlay">
                        <div style={{ width: 44, height: 44, background: 'red', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontSize: 18, marginLeft: 4 }}></span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{v.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{v.channel || v.provider}</div>
                    </div>
                  </div>
                </a>
              ))}
              {!(resources.videos || resources.youtube || []).length && (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No video recommendations found.
                </div>
              )}
            </div>
          )}

          {/* Docs */}
          {activeTab === 'docs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {(resources.docs || []).map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card"
                    style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Tag label={doc.skill} color="#eef2ff" textColor="#4338ca" border="#c7d2fe" />
                    <div style={{ fontWeight: 800, fontSize: 14, margin: '10px 0 6px', color: 'var(--text)' }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{doc.description}</div>
                    <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>Open guide</div>
                  </div>
                </a>
              ))}
              {!resources.docs?.length && (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No documentation links found.
                </div>
              )}
            </div>
          )}

          {/* Courses */}
          {activeTab === 'courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(resources.courses || resources.nptel || []).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <Tag label={c.type || c.category || c.provider || 'Course'} color="#dbeafe" textColor="#1d4ed8" border="#bfdbfe" />
                        <div style={{ fontWeight: 800, fontSize: 15, marginTop: 8, color: 'var(--text)' }}>{c.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{c.description}</div>
                      </div>
                      {(c.duration || c.priority) && <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>DURATION</div>
                        <div style={{ fontWeight: 700, color: 'var(--orange-600)', fontSize: 13 }}>{c.duration || c.priority}</div>
                      </div>}
                    </div>
                  </div>
                </a>
              ))}
              {!(resources.courses || resources.nptel || []).length && (
                <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No course matches found. <a href="https://nptel.ac.in/course-list" target="_blank" rel="noreferrer" style={{ color: 'var(--orange-600)' }}>Browse NPTEL courses</a>
                </div>
              )}
            </div>
          )}

          {/* Soft Skill Practice */}
          {activeTab === 'soft' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {(resources.soft_skills || []).map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Tag label={item.skill} color="#fef3c7" textColor="#92400e" border="#fde68a" />
                    <div style={{ fontWeight: 800, fontSize: 14, margin: '10px 0 6px', color: 'var(--text)' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{item.description}</div>
                    <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: '#92400e' }}>Practice now</div>
                  </div>
                </a>
              ))}
              {!resources.soft_skills?.length && (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No soft-skill practice items found.
                </div>
              )}
            </div>
          )}

          {/* Coursera */}
          {activeTab === 'coursera' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {resources.coursera.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card"
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                    style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
                    <Tag label={c.skill} />
                    <div style={{ fontWeight: 800, fontSize: 14, margin: '10px 0 6px', color: 'var(--text)' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{c.description}</div>
                    <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>Open on Coursera →</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '14px' }} onClick={() => onNext('interview')}>
          Start Mock Interview →
        </button>
      </div>
    </div>
  );
};

/* ── STAGE 4: Mock Interview ─────────────────────────── */
const InterviewStage = () => {
  const [phase, setPhase] = useState('intro'); // intro | active | summary
  const [sessionId, setSessionId] = useState('');
  const [totalQ, setTotalQ] = useState(5);
  const [currentQ, setCurrentQ] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textRef = useRef();

  const TYPE_ICONS = { Technical: "T", DSA: "D", Project: "P", Design: "A", Behavioural: "B" };
  const TYPE_COLORS = { Technical: '#6366f1', DSA: '#0891b2', Project: '#16a34a', Design: '#7c3aed', Behavioural: '#d97706' };

  const startInterview = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/api/resume/interview/start`, {}, { headers: authHdr() });
      setSessionId(res.data.session_id);
      setTotalQ(res.data.total_questions);
      setCurrentQ(res.data.current_question);
      setQIndex(0);
      setPhase('active');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true); setError(''); setFeedback(null);
    try {
      const res = await axios.post(`${API}/api/resume/interview/respond`, {
        session_id: sessionId,
        answer: answer.trim(),
        question_index: qIndex,
      }, { headers: authHdr() });

      setFeedback(res.data.feedback);
      setShowFeedback(true);

      if (res.data.is_done) {
        // Fetch summary after a delay
        setTimeout(async () => {
          const sumRes = await axios.get(`${API}/api/resume/interview/summary?session_id=${sessionId}`, { headers: authHdr() });
          setSummary(sumRes.data);
          setPhase('summary');
        }, 2500);
      } else {
        setTimeout(() => {
          setCurrentQ(res.data.next_question);
          setQIndex(res.data.next_index);
          setAnswer('');
          setShowFeedback(false);
          setFeedback(null);
          textRef.current?.focus();
        }, 2500);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  };

  // ── Intro ─────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"#F97316"}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>AI Mock Interview</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
          You'll answer <strong>5 personalised questions</strong> generated from your resume —
          technical, problem-solving, project, system design, and behavioural.<br /><br />
          After each answer, you'll receive instant AI feedback and a score.
          At the end, you'll get a hiring verdict.
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {["Technical", "DSA", "Projects", "Design", "Behaviour"].map(t => (
            <div key={t} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 6px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
              {t}
            </div>
          ))}
        </div>
        {error && <div style={{ marginBottom: 16, color: '#dc2626', fontSize: 13 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}</div>}
        <button className="btn btn-primary" onClick={startInterview}
          disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
          {loading ? 'Preparing Questions…' : <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8}}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>Start Interview</span>}
        </button>
      </div>
    );
  }

  // ── Active Interview ──────────────────────────────────
  if (phase === 'active') {
    const typeColor = TYPE_COLORS[currentQ?.type] || '#F97316';
    const typeIcon = TYPE_ICONS[currentQ?.type] || "";
    const progressPct = ((qIndex) / totalQ) * 100;

    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Progress Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Question {qIndex + 1} of {totalQ}</span>
            <span style={{ background: typeColor + '20', color: typeColor, borderRadius: 99, padding: '2px 12px', fontSize: 12, fontWeight: 700 }}>
              {typeIcon} {currentQ?.type}
            </span>
          </div>
          <ProgressBar value={progressPct} />
        </div>

        {/* Question Card */}
        <div className="card" style={{ marginBottom: 20, borderLeft: `4px solid ${typeColor}` }}>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.5, color: 'var(--text)', marginBottom: currentQ?.hint ? 14 : 0 }}>
            {currentQ?.question}
          </div>
          {currentQ?.hint && !showFeedback && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', borderLeft: '3px solid var(--border)' }}>
              Hint: {currentQ.hint}
            </div>
          )}
        </div>

        {/* Feedback After Submission */}
        {showFeedback && feedback && (
          <div className="card" style={{
            marginBottom: 20, borderLeft: `4px solid ${VERDICT_COLOR[feedback.verdict] || '#F97316'}`,
            background: VERDICT_BG[feedback.verdict] || 'var(--surface)', animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>AI Feedback</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: VERDICT_COLOR[feedback.verdict] }}>
                  {feedback.score}/10
                </span>
                <span style={{ background: VERDICT_BG[feedback.verdict], color: VERDICT_COLOR[feedback.verdict], borderRadius: 99, padding: '2px 12px', fontSize: 12, fontWeight: 700, border: `1px solid ${VERDICT_COLOR[feedback.verdict]}40` }}>
                  {feedback.verdict}
                </span>
              </div>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.6 }}>{feedback.feedback}</p>
            {feedback.ideal_points?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>KEY POINTS TO INCLUDE:</div>
                {feedback.ideal_points.map((pt, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{pt}</div>
                ))}
              </>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              {loading ? <span>Loading next question…</span> : ' Moving to next question…'}
            </div>
          </div>
        )}

        {/* Answer Input */}
        {!showFeedback && (
          <>
            <textarea
              ref={textRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here. Be detailed — the AI evaluates depth and accuracy."
              disabled={loading}
              rows={6}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                border: '1.5px solid var(--border)', outline: 'none',
                fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit',
                background: 'var(--surface)', color: 'var(--text)',
                resize: 'vertical', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#F97316'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{answer.length} characters</span>
              <button className="btn btn-primary" onClick={submitAnswer}
                disabled={!answer.trim() || loading}
                style={{ padding: '10px 28px' }}>
                {loading ? 'Evaluating…' : 'Submit Answer →'}
              </button>
            </div>
          </>
        )}

        {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F59E0B"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Warning: {error}</div>}
      </div>
    );
  }

  // ── Summary ───────────────────────────────────────────
  if (phase === 'summary' && summary) {
    return (
      <div>
        {/* Final Score Hero */}
        <div className="dash-hero-card" style={{ marginBottom: 28 }}>
          <div className="dash-hero-left">
            <div className="dash-hero-greeting">Interview Complete </div>
            <h1 className="dash-hero-title" style={{ fontSize: 22 }}>{summary.hiring_verdict}</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: 0 }}>
              You answered {summary.answered} of {summary.total_questions} questions.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={summary.final_score} size={100}
              color={summary.verdict_color || '#F97316'} />
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700, marginTop: 6 }}>Final Score</div>
          </div>
          <div className="hero-circle hero-circle-1" />
          <div className="hero-circle hero-circle-2" />
        </div>

        {/* Per-Question Breakdown */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 18 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#64748B"}}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> Question-by-Question Breakdown</h2>
          {summary.breakdown.map((b, i) => (
            <div key={i} style={{
              padding: '16px 0',
              borderBottom: i < summary.breakdown.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>Q{b.question_index}</span>
                    <span style={{ background: 'var(--orange-100)', color: 'var(--orange-700)', borderRadius: 99, padding: '1px 10px', fontSize: 11, fontWeight: 700 }}>
                      {TYPE_ICONS[b.type]} {b.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{b.question}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.feedback}</div>
                  {b.ideal_points?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {b.ideal_points.map((pt, j) => (
                        <div key={j} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pt}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: VERDICT_COLOR[b.verdict] || 'var(--orange-600)' }}>
                    {b.score}/10
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: VERDICT_COLOR[b.verdict], background: VERDICT_BG[b.verdict], borderRadius: 99, padding: '2px 8px', marginTop: 4 }}>
                    {b.verdict}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '13px' }}
            onClick={() => window.location.reload()}>
            <Icon name="upload" size={17} style={{ marginRight: 8 }} />
            Upload New Resume
          </button>
          <button className="btn btn-primary" style={{ flex: 1, padding: '13px' }}
            onClick={() => { setPhase('intro'); setAnswer(''); setFeedback(null); setSummary(null); }}>
            <Icon name="interview" size={17} style={{ marginRight: 8 }} />
            Retry Interview
          </button>
        </div>
      </div>
    );
  }

  return null;
};

/* ── MAIN: ResumeAnalyser ────────────────────────────── */
const STAGES = [
  { id: 'upload', label: 'Upload', icon: 'upload', step: 1 },
  { id: 'analysis', label: 'Analysis', icon: 'skills', step: 2 },
  { id: 'resources', label: 'Resources', icon: 'resources', step: 3 },
  { id: 'interview', label: 'Interview', icon: 'interview', step: 4 },
];

const ResumeAnalyser = () => {
  const [stage, setStage] = useState('upload');
  const [analysis, setAnalysis] = useState(null);

  const handleAnalysed = (data) => {
    setAnalysis(data);
    setStage('analysis');
  };

  const goTo = (s) => {
    if (s === 'analysis' && !analysis) return;
    if ((s === 'resources' || s === 'interview') && !analysis) return;
    setStage(s);
  };

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
            <Icon name="resume" size={30} color="var(--orange-600)" style={{ marginRight: 10 }} />
            Resume AI
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Upload → Analyse → Learn → Interview. All powered by AI.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
          {STAGES.map((s, i) => {
            const done = STAGES.findIndex(x => x.id === stage) > i;
            const active = stage === s.id;
            const locked = !analysis && (s.id === 'analysis' || s.id === 'resources' || s.id === 'interview');
            return (
              <React.Fragment key={s.id}>
                <div
                  onClick={() => !locked && goTo(s.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: done ? '#16a34a' : active ? 'var(--grad)' : 'var(--surface)',
                    border: `2px solid ${done ? '#16a34a' : active ? '#F97316' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? 18 : 20, color: done || active ? 'white' : 'var(--text)',
                    transition: 'all 0.3s', boxShadow: active ? 'var(--shadow-md)' : 'none'
                  }}>
                    {done ? <Icon name="check" size={20} color="white" /> : <Icon name={s.icon} size={20} color={done || active ? 'white' : 'var(--text)'} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? 'var(--orange-600)' : done ? '#16a34a' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 6px', marginBottom: 22,
                    background: STAGES.findIndex(x => x.id === stage) > i ? '#16a34a' : 'var(--border)',
                    transition: 'background 0.4s'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Stage Content */}
        {stage === 'upload' && <UploadStage onAnalysed={handleAnalysed} />}
        {stage === 'analysis' && analysis && <AnalysisStage analysis={analysis} onNext={setStage} />}
        {stage === 'resources' && analysis && <ResourcesStage analysis={analysis} onNext={setStage} />}
        {stage === 'interview' && <InterviewStage />}
      </div>
    </div>
  );
};

export default ResumeAnalyser;
