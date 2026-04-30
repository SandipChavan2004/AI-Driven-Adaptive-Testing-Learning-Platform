import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import { downloadTestReport } from '../utils/pdfExport';

const Results = ({ user }) => {
  const { testId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First, ensure test is finished and get analytics
      const finishResponse = await axios.post(
        'http://localhost:5000/api/test/finish',
        { test_id: testId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(finishResponse.data.analytics);

      // Then get recommendations
      const recResponse = await axios.post(
        'http://localhost:5000/api/recommendations',
        { test_id: testId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecommendations(recResponse.data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      // Try to get analytics anyway if test is already finished
      try {
        const token = localStorage.getItem('token');
        const recResponse = await axios.post(
          'http://localhost:5000/api/recommendations',
          { test_id: testId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecommendations(recResponse.data);
      } catch (e) {
        console.error('Failed to fetch recommendations:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const recs = [
        ...(recommendations?.youtube_videos || []).slice(0, 2).map(v => ({ title: v.title })),
        ...(recommendations?.coursera_courses || []).slice(0, 2).map(c => ({ title: c.title })),
        ...(recommendations?.nptel_courses || []).slice(0, 2).map(c => ({ title: c.title })),
      ];
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await downloadTestReport({
        subject:         analytics?.subject || 'Test',
        score:           Math.round(analytics?.capability_score || 0),
        accuracy:        analytics ? analytics.accuracy.toFixed(1) : 0,
        correct:         analytics?.correct_answers || 0,
        total:           analytics?.total_questions || 0,
        level:           analytics?.final_capability_level || 'Beginner',
        userName:        user.name || 'Student',
        date:            new Date().toLocaleDateString('en-IN'),
        recommendations: recs,
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>Test Results</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {analytics && (
              <button
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                
                {downloading ? 'Generating...' : 'Download PDF'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        {analytics && (
          <div className="card">
            <h2>Performance Analytics</h2>
            <div className="analytics">
              <div className="analytics-card">
                <h3>Accuracy</h3>
                <div className="value">{analytics.accuracy.toFixed(1)}%</div>
              </div>
              <div className="analytics-card">
                <h3>Average Time</h3>
                <div className="value">{analytics.avg_time.toFixed(1)}s</div>
              </div>
              <div className="analytics-card">
                <h3>Capability Score</h3>
                <div className="value">{analytics.capability_score.toFixed(1)}</div>
              </div>
              <div className="analytics-card">
                <h3>Final Level</h3>
                <div className="value">{analytics.final_capability_level}</div>
              </div>
            </div>
            <div style={{ marginTop: '30px' }}>
              <h3>Test Summary</h3>
              <p><strong>Total Questions:</strong> {analytics.total_questions}</p>
              <p><strong>Correct Answers:</strong> {analytics.correct_answers}</p>
              <p><strong>Difficulty Progression:</strong> {analytics.difficulty_progression.join(' → ')}</p>
            </div>
          </div>
        )}

        {recommendations && (
          <div className="card">
            <h2>Personalized Recommendations</h2>
            
            {recommendations.youtube_videos && recommendations.youtube_videos.length > 0 && (
              <div className="recommendations">
                <h3 style={{ marginBottom: '20px', color: 'var(--orange-600)' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#EF4444"}}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg> YouTube Videos</h3>
                {recommendations.youtube_videos.slice(0, 5).map((video, index) => (
                  <div key={index} className="recommendation-item">
                    {video.thumbnail && (
                      <img src={video.thumbnail} alt={video.title} />
                    )}
                    <div className="recommendation-content">
                      <h4>{video.title}</h4>
                      <p>{video.description.substring(0, 150)}...</p>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        Watch on YouTube →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendations.courses && recommendations.courses.length > 0 && (
              <div className="recommendations" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--orange-600)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:8, color:"#F97316"}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Recommended Courses — Coursera
                </h3>
                {recommendations.courses.map((course, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-content">
                      <h4>{course.title}</h4>
                      <p>
                        <strong>Provider:</strong> {course.provider}
                        <span className="badge-paid" style={{ marginLeft: '10px' }}>Paid / Audit Free</span>
                      </p>
                      <p>{course.description}</p>
                      <a href={course.url} target="_blank" rel="noopener noreferrer">
                        View on Coursera →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── NPTEL Courses Section ── */}
            {recommendations.nptel_courses && recommendations.nptel_courses.length > 0 && (
              <div className="recommendations" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '6px', color: 'var(--orange-600)' }}>
                   NPTEL Free Courses — IIT / IISc
                </h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
                  Government-certified free courses by India's top institutes. Optional paid certificate available.
                </p>
                {recommendations.nptel_courses.map((course, index) => (
                  <div key={index} className="recommendation-item nptel-item">
                    <div className="nptel-logo-col">
                      <div className="nptel-logo">NPTEL</div>
                      <span className="nptel-free-badge">FREE</span>
                    </div>
                    <div className="recommendation-content">
                      <h4>{course.title}</h4>
                      <p style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span><strong>Provider:</strong> {course.provider}</span>
                        <span><strong>Duration:</strong> {course.duration}</span>
                        <span><strong>Type:</strong> {course.type}</span>
                      </p>
                      <p>{course.description}</p>
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="nptel-link">
                        View NPTEL Course →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
            Take Another Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;

