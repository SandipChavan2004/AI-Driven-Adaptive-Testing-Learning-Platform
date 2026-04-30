import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../App.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/subjects',  label: 'Subjects' },
  { to: '/roadmap',   label: 'Study Plan' },
  { to: '/leaderboard', label: 'Ranking' },
  { to: '/dna',       label: 'Learning DNA' },
  { to: '/resume',    label: 'Resume AI' },
];

const Navbar = ({ user, onLogout, streak = 0, darkMode, onToggleDark }) => {
  const { t } = useTranslation();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobOpen,  setMobOpen]  = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/user/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data.notifications || []);
    } catch (err) { console.error('Failed to fetch notifications'); }
  };

  const markRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/user/notifications/clear', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (err) {}
  };

  // const toggleLang = () => {
  //   i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  // };

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    setDropOpen(false);
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="app-navbar">
      <div className="navbar-inner">

        {/* ── Brand ── */}
        <NavLink to="/dashboard" className="navbar-brand-link">
          <img src="/logo.png" alt="VantageLearn logo" className="navbar-logo" />
          <span className="navbar-brand">CodeMentor<span style={{ color: 'var(--orange-500)' }}>AI</span></span>
        </NavLink>

        {/* ── Desktop Nav Links ── */}
        <div className="navbar-links">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'navbar-link--active' : ''}`}
            >
              {t(item.label)}
            </NavLink>
          ))}
        </div>

        {/* ── Right Side ── */}
        <div className="navbar-right">
          {/* Streak pill */}
          {streak > 0 && (
            <div className="navbar-streak">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle", marginRight:4, color:"#EF4444"}}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
              <span>{streak}</span>
            </div>
          )}

          {/* Dark toggle */}
          <button className="dark-toggle mode-toggle" onClick={onToggleDark} title={darkMode ? 'Light mode' : 'Dark mode'} aria-label="Toggle Dark Mode" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {/* Lang toggle */}
          {/* <button className="dark-toggle" onClick={toggleLang} title="Translate" aria-label="Toggle Language" style={{ fontSize: '16px', marginLeft: '8px', marginRight: '8px' }}>
            
          </button> */}

          {/* Notifications */}
          <div className="navbar-user" ref={notifRef} style={{ marginRight: '16px' }}>
            <button className="dark-toggle" aria-label="Notifications" aria-expanded={notifOpen} onClick={() => { setNotifOpen(!notifOpen); if(!notifOpen) fetchNotifications(); }} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {notifications.some(n => !n.read) && <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', border: '2px solid var(--surface)' }}></div>}
            </button>
            {notifOpen && (
              <div className="user-dropdown" style={{ width: '300px', right: '-20px', padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>Notifications</h3>
                  <button onClick={markRead} style={{ background: 'none', border: 'none', color: 'var(--orange-600)', fontSize: '11px', cursor: 'pointer' }}>Mark all read</button>
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No updates</div> : null}
                  {notifications.map((n, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--orange-50)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar + Dropdown */}
          <div className="navbar-user" ref={dropRef}>
            <button className="user-avatar-btn" aria-label="User Menu" aria-expanded={dropOpen} onClick={() => setDropOpen(!dropOpen)}>
              <div className="user-avatar">{initials}</div>
              <span className="user-name-short">{(user?.name || '').split(' ')[0]}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px' }}>▾</span>
            </button>

            {dropOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar user-avatar--lg">{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{user?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/dashboard'); }}>
                  {t('Dashboard')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/subjects'); }}>
                  {t('Browse Subjects')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/roadmap'); }}>
                  {t('Study Plan')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/leaderboard'); }}>
                  {t('Ranking')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/resume'); }}>
                  Resume AI
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                  {t('Sign Out')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button className="navbar-burger" onClick={() => setMobOpen(!mobOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobOpen && (
        <div className="navbar-mobile">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className="mobile-nav-link" onClick={() => setMobOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <button className="mobile-nav-link" style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '12px 0' }}
            onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
