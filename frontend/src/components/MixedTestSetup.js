import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

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
  default:           'https://img.icons8.com/fluency/96/book.png'
};

const MixedTestSetup = () => {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [config, setConfig] = useState({ num_questions: 15, starting_difficulty: 'easy', time_limit: 900 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const toggleSubject = (subj) => {
    const newSel = new Set(selected);
    if (newSel.has(subj)) newSel.delete(subj);
    else newSel.add(subj);
    setSelected(newSel);
  };

  const startMixedTest = () => {
    if (selected.size < 2) return alert('Select at least 2 subjects for a mixed test.');
    sessionStorage.setItem('testConfig', JSON.stringify(config));
    const mergedSubjectString = Array.from(selected).join(',');
    navigate(`/test/${encodeURIComponent(mergedSubjectString)}`);
  };

  return (
    <div className="app-layout" style={{ paddingTop: '64px' }}>
      <div style={{ background: 'var(--grad-soft)', padding: '48px 0 36px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '6px', color: 'var(--orange-600)' }}>Mixed Subject Test</h1>
            <p style={{ fontSize: '17px', color: 'var(--text-2)', maxWidth: '600px', margin: 0 }}>
              Blend topics together to simulate real-world technical interviews and integrated exams.
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px', padding: '40px 20px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Left Col: Subject Selection */}
        <div style={{ flex: '1 1 600px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Select Subjects (min. 2)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {subjects.map(s => {
              const isSelected = selected.has(s);
              return (
                <div key={s} 
                  onClick={() => toggleSubject(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                    border: isSelected ? '2px solid var(--orange-500)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--orange-50)' : 'var(--surface)',
                    transition: 'all 0.15s'
                  }}>
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '4px', 
                    border: isSelected ? '0' : '2px solid var(--border)',
                    background: isSelected ? 'var(--orange-500)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <img src={ICON_MAP[s] || ICON_MAP.default} alt={s} style={{ width: '28px', height: '28px' }} />
                  <span style={{ fontWeight: isSelected ? 700 : 500, color: 'var(--text)' }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Configuration */}
        <div style={{ flex: '0 0 320px' }}>
          <div className="card" style={{ position: 'sticky', top: '90px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Configuration</h2>
            
            <div className="config-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>TOTAL QUESTIONS</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[10, 15, 20, 30].map(n => (
                  <button key={n} onClick={() => setConfig(c => ({...c, num_questions: n}))}
                    className={`btn ${config.num_questions === n ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}>{n} Qs</button>
                ))}
              </div>
            </div>

            <div className="config-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>TIME LIMIT</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{v: 0, l: 'No Limit'}, {v: 600, l: '10 min'}, {v: 900, l: '15 min'}, {v: 1800, l: '30 min'}].map(t => (
                  <button key={t.v} onClick={() => setConfig(c => ({...c, time_limit: t.v}))}
                    className={`btn ${config.time_limit === t.v ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '12px' }}>{t.l}</button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
              <strong>Selected:</strong> {selected.size} subjects.<br/>
              Questions will be pulled dynamically across all selected subjects.
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              disabled={selected.size < 2}
              onClick={startMixedTest}>
              Start Mixed Test →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixedTestSetup;
