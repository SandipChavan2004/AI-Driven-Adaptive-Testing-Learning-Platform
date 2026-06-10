import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import './Roadmap.css';

const Roadmap = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [notesStatus, setNotesStatus] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [hasQuizHistory, setHasQuizHistory] = useState(false);
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    fetchRoadmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave notes logic
  useEffect(() => {
    if (!activeTopic) return;
    const currentSavedNotes = roadmap?.notes?.[activeTopic.id] || '';
    if (notesText === currentSavedNotes) return;

    setNotesStatus('Saving changes...');
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/roadmap/update-notes', {
          topic_id: activeTopic.id,
          notes: notesText
        }, { headers: { Authorization: `Bearer ${token}` } });

        setRoadmap(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            notes: {
              ...prev.notes,
              [activeTopic.id]: notesText
            }
          };
        });
        setNotesStatus('Notes saved');
      } catch (err) {
        console.error(err);
        setNotesStatus('Failed to auto-save notes');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notesText, activeTopic, roadmap]);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/roadmap', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.roadmap) {
        setRoadmap(res.data.roadmap);
        setLoading(false);
      } else {
        // Fallback: Check dashboard to see if quiz history exists to auto-generate
        const dashRes = await axios.get('http://localhost:5000/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (dashRes.data.test_history && dashRes.data.test_history.length > 0) {
          setHasQuizHistory(true);
          // Extract weak areas
          const computedWeakAreas = [...new Set(dashRes.data.test_history.filter(t => t.accuracy < 70).map(t => t.subject))].slice(0, 3);
          setWeakAreas(computedWeakAreas);
          // Trigger generate
          triggerGeneration(computedWeakAreas);
        } else {
          setHasQuizHistory(false);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const triggerGeneration = async (areasToUse) => {
    setGenerating(true);
    setLoading(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/roadmap/generate', {
        weak_areas: areasToUse || weakAreas,
        level: user?.capability_level || 'Intermediate'
      }, { headers: { Authorization: `Bearer ${token}` } });

      setRoadmap(res.data.roadmap);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (topicId, status) => {
    if (!roadmap) return;

    // Optimistic UI updates
    setRoadmap(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.progress = { ...updated.progress, [topicId]: status };

      // Also sync subtopics
      const targetTopic = findTopicById(topicId);
      if (targetTopic) {
        const count = targetTopic.subtopics.length;
        for (let i = 0; i < count; i++) {
          updated.subtopic_progress[`${topicId}_${i}`] = status === 'completed';
        }
      }
      return updated;
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/roadmap/update-status', {
        topic_id: topicId,
        status: status
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Update activeTopic locally to mirror updates in the Drawer
      if (activeTopic && activeTopic.id === topicId) {
        setActiveTopic(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error(err);
      // Revert if error occurs by fetching latest
      fetchRoadmap();
    }
  };

  const handleSubtopicToggle = async (topicId, subIndex, checked) => {
    if (!roadmap) return;

    // Optimistic UI updates
    setRoadmap(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      const key = `${topicId}_${subIndex}`;
      updated.subtopic_progress[key] = checked;

      // Calculate parent topic status
      const targetTopic = findTopicById(topicId);
      if (targetTopic) {
        let completedCount = 0;
        targetTopic.subtopics.forEach((_, idx) => {
          if (updated.subtopic_progress[`${topicId}_${idx}`]) completedCount++;
        });

        let newStatus = 'todo';
        if (completedCount === targetTopic.subtopics.length) {
          newStatus = 'completed';
        } else if (completedCount > 0) {
          newStatus = 'in_progress';
        }
        updated.progress[topicId] = newStatus;
      }
      return updated;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/roadmap/update-subtopic', {
        topic_id: topicId,
        subtopic_index: subIndex,
        completed: checked
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (activeTopic && activeTopic.id === topicId) {
        setActiveTopic(prev => prev ? { ...prev, status: res.data.parent_status } : null);
      }
    } catch (err) {
      console.error(err);
      fetchRoadmap();
    }
  };

  const findTopicById = (id) => {
    if (!roadmap) return null;
    for (const week of roadmap.weeks) {
      for (const topic of week.topics) {
        if (topic.id === id) return topic;
      }
    }
    return null;
  };

  const handleNodeClick = (topic, week) => {
    setActiveTopic(topic);
    setActiveWeek(week);
    setNotesText(roadmap?.notes?.[topic.id] || '');
    setNotesStatus('');
  };

  const closeDrawer = () => {
    setActiveTopic(null);
    setActiveWeek(null);
  };

  const getSubtopicCount = (topicId) => {
    const topic = findTopicById(topicId);
    if (!topic) return { completed: 0, total: 0 };
    const total = topic.subtopics.length;
    let completed = 0;
    for (let i = 0; i < total; i++) {
      if (roadmap?.subtopic_progress?.[`${topicId}_${i}`]) completed++;
    }
    return { completed, total };
  };

  // Calculate percentage of completed topics
  const getProgressStats = () => {
    if (!roadmap) return { percent: 0, completed: 0, total: 0 };
    let total = 0;
    let completed = 0;
    roadmap.weeks.forEach(w => {
      w.topics.forEach(t => {
        total++;
        if (roadmap.progress?.[t.id] === 'completed') {
          completed++;
        }
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percent, completed, total };
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className="app-layout"><div className="loading">Analyzing learning profile and mapping curriculum...</div></div>
    );
  }

  if (generating) {
    return (
      <div className="app-layout">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div className="loading" style={{ margin: 0 }}>Building your roadmap...</div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Aligning weaknesses with optimal learning nodes.</p>
        </div>
      </div>
    );
  }

  // Welcome message if no quiz data yet
  if (!roadmap) {
    return (
      <div className="app-layout roadmap-page" style={{ paddingTop: '64px' }}>
        <div style={{ background: 'var(--grad-soft)', padding: '48px 0 36px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', color: 'var(--orange-600)' }}>
              Interactive Study Plan
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-2)' }}>
              Unlock your visual learning path generated dynamically based on your test results.
            </p>
          </div>
        </div>

        <div className="container" style={{ maxWidth: '900px', padding: '60px 20px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center', padding: '40px' }}>
            <img src="https://img.icons8.com/fluency/96/route.png" alt="Roadmap" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>
              No Roadmap Available Yet
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '24px', lineHeight: '1.6' }}>
              Welcome to CodeMentorAI! Take your first Adaptive Test in any subject. Once we have a baseline of your strengths and weaknesses, our AI will generate a personalized 4-week study plan.
            </p>
            <a href="/subjects" className="btn btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
              Take Baseline Quiz
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout roadmap-page" style={{ paddingTop: '64px' }}>
      {/* Page Header */}
      <div style={{ background: 'var(--grad-soft)', padding: '40px 0 28px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '8px', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="https://img.icons8.com/fluency/38/route.png" alt="map icon" />
                AI Learning Roadmap
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
                A highly structured 4-week learning path generated to target your weak areas.
              </p>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowRegenModal(true)}
              style={{ border: '1px solid var(--orange-600)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Regenerate Plan
            </button>
          </div>
        </div>
      </div>

      <div className="roadmap-container">
        {/* Progress Summary Card */}
        <div className="roadmap-progress-card">
          <div className="roadmap-progress-header">
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Overall Progress
            </h2>
            <div className="roadmap-progress-stats">
              <div className="roadmap-stat-item">
                <span className="roadmap-stat-val">{stats.percent}%</span>
                <span className="roadmap-stat-label">Mastery</span>
              </div>
              <div className="roadmap-stat-item">
                <span className="roadmap-stat-val">{stats.completed}/{stats.total}</span>
                <span className="roadmap-stat-label">Nodes Done</span>
              </div>
            </div>
          </div>
          <div className="roadmap-bar-wrapper">
            <div className="roadmap-bar-fill" style={{ width: `${stats.percent}%` }}></div>
          </div>
        </div>

        {/* Vertical Timeline Tree */}
        <div className="roadmap-timeline">
          {roadmap.weeks.map((week) => (
            <div key={week.week_number} className="roadmap-week-block">
              {/* Timeline dot */}
              <div className="roadmap-week-dot"></div>

              {/* Week Header */}
              <div className="roadmap-week-title-area">
                <h3 className="roadmap-week-num">Week {week.week_number}</h3>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>{week.title}</h4>
                <p className="roadmap-week-desc">{week.description}</p>
              </div>

              {/* Weekly Topics */}
              <div className="roadmap-topics-grid">
                {week.topics.map((topic) => {
                  const status = roadmap.progress?.[topic.id] || 'todo';
                  const subCounts = getSubtopicCount(topic.id);
                  const miniProgressWidth = subCounts.total > 0 ? (subCounts.completed / subCounts.total) * 100 : 0;

                  return (
                    <div 
                      key={topic.id} 
                      className={`roadmap-node-card ${status}-node`}
                      onClick={() => handleNodeClick(topic, week)}
                    >
                      <div className="roadmap-node-header">
                        <h5 className="roadmap-node-title">{topic.title}</h5>
                        <span className={`roadmap-status-badge ${status}-badge`}>
                          {status === 'completed' && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 2 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                          {status === 'in_progress' && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 2 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          )}
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="roadmap-node-desc">{topic.description}</p>
                      
                      <div className="roadmap-node-footer">
                        <span>{subCounts.completed}/{subCounts.total} Subtopics</span>
                        <div className="roadmap-mini-progress">
                          <div className="roadmap-mini-progress-fill" style={{ width: `${miniProgressWidth}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Slide-out Drawer */}
      <div 
        className={`roadmap-drawer-overlay ${activeTopic ? 'open' : ''}`}
        onClick={closeDrawer}
      >
        <div 
          className="roadmap-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          {activeTopic && (
            <>
              {/* Drawer Header */}
              <div className="roadmap-drawer-header">
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Week {activeWeek?.week_number} • Focus Node
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', margin: '4px 0 0 0' }}>
                    {activeTopic.title}
                  </h3>
                </div>
                <button className="roadmap-drawer-close" onClick={closeDrawer}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="roadmap-drawer-content">
                {/* Description */}
                <div>
                  <h4 className="roadmap-section-title">Description</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-2)', margin: 0 }}>
                    {activeTopic.description}
                  </p>
                </div>

                {/* Status Switcher */}
                <div>
                  <h4 className="roadmap-section-title">Status</h4>
                  <div className="roadmap-status-selector">
                    <button 
                      className={`roadmap-status-btn todo ${roadmap.progress?.[activeTopic.id] === 'todo' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(activeTopic.id, 'todo')}
                    >
                      To Do
                    </button>
                    <button 
                      className={`roadmap-status-btn in_progress ${roadmap.progress?.[activeTopic.id] === 'in_progress' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(activeTopic.id, 'in_progress')}
                    >
                      In Progress
                    </button>
                    <button 
                      className={`roadmap-status-btn completed ${roadmap.progress?.[activeTopic.id] === 'completed' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(activeTopic.id, 'completed')}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                {/* Subtopic Checklist */}
                <div>
                  <h4 className="roadmap-section-title">Subtopics Checklist</h4>
                  <div className="roadmap-subtopic-list">
                    {activeTopic.subtopics.map((sub, idx) => {
                      const key = `${activeTopic.id}_${idx}`;
                      const isCompleted = roadmap.subtopic_progress?.[key] || false;

                      return (
                        <div 
                          key={idx} 
                          className={`roadmap-subtopic-item ${isCompleted ? 'done' : ''}`}
                          onClick={() => handleSubtopicToggle(activeTopic.id, idx, !isCompleted)}
                        >
                          <input 
                            type="checkbox" 
                            checked={isCompleted} 
                            onChange={(e) => handleSubtopicToggle(activeTopic.id, idx, e.target.checked)}
                            onClick={(e) => e.stopPropagation()} 
                          />
                          <span className="roadmap-subtopic-text">{sub}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="roadmap-section-title">Recommended Resources</h4>
                  <div className="roadmap-resources-list">
                    {activeTopic.resources && activeTopic.resources.map((res, idx) => {
                      const isYoutube = res.url?.includes('youtube.com');
                      const isCourse = res.type === 'course' || res.url?.includes('nptel.ac.in');

                      return (
                        <a 
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="roadmap-resource-card"
                        >
                          <div className="roadmap-resource-info">
                            <span className="roadmap-resource-icon">
                              {isYoutube && (
                                <img src="https://img.icons8.com/color/24/youtube-play.png" alt="youtube" />
                              )}
                              {isCourse && (
                                <img src="https://img.icons8.com/fluency/24/graduation-cap.png" alt="course" />
                              )}
                              {!isYoutube && !isCourse && (
                                <img src="https://img.icons8.com/fluency/24/document.png" alt="documentation" />
                              )}
                            </span>
                            <div>
                              <div className="roadmap-resource-title">{res.title}</div>
                              <span className="roadmap-resource-type">{res.type}</span>
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                      );
                    })}
                    {/* Add an automatic search button if resources is empty */}
                    {(!activeTopic.resources || activeTopic.resources.length === 0) && (
                      <a 
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeTopic.title + ' Tutorial')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="roadmap-resource-card"
                      >
                        <div className="roadmap-resource-info">
                          <span className="roadmap-resource-icon">
                            <img src="https://img.icons8.com/color/24/youtube-play.png" alt="youtube" />
                          </span>
                          <div>
                            <div className="roadmap-resource-title">Search Youtube Tutorials</div>
                            <span className="roadmap-resource-type">video</span>
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Notes & Reflections */}
                <div>
                  <h4 className="roadmap-section-title">My Notes & Reflections</h4>
                  <textarea 
                    className="roadmap-notes-area"
                    placeholder="Document your study hours, reflections, doubts, or key takeaways for this topic here. Content auto-saves."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                  />
                  {notesStatus && (
                    <div className="roadmap-notes-status">{notesStatus}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Regeneration Warning Modal */}
      {showRegenModal && (
        <div className="roadmap-modal-overlay">
          <div className="roadmap-modal">
            <h3 className="roadmap-modal-title">Regenerate Roadmap?</h3>
            <p className="roadmap-modal-text">
              Regenerating your study roadmap will evaluate your latest adaptive test history and create a fresh weekly schedule. 
              <br /><br />
              <strong style={{ color: 'var(--orange-600)' }}>Warning:</strong> This will clear your current checklists, node completions, and study reflections. This action cannot be undone.
            </p>
            <div className="roadmap-modal-actions">
              <button 
                className="roadmap-modal-btn cancel"
                onClick={() => setShowRegenModal(false)}
              >
                Keep Current
              </button>
              <button 
                className="roadmap-modal-btn confirm"
                onClick={() => {
                  setShowRegenModal(false);
                  triggerGeneration();
                }}
              >
                Regenerate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
