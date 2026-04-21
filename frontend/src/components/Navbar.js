import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../App.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',       icon: 'https://img.icons8.com/fluency/24/home.png' },
  { to: '/subjects',  label: 'Subjects',   icon: 'https://img.icons8.com/fluency/24/books.png' },
  { to: '/roadmap',   label: 'Study Plan', icon: 'https://img.icons8.com/fluency/24/map.png' },
  { to: '/leaderboard', label: 'Ranking',  icon: 'https://img.icons8.com/fluency/24/prize.png' },
  { to: '/dna',       label: 'Learning DNA', icon: 'https://img.icons8.com/color/24/dna-helix.png' },
  { to: '/resume',    label: 'Resume AI',  icon: 'https://img.icons8.com/fluency/24/resume.png' },
];

const Navbar = ({ user, onLogout, streak = 0, darkMode, onToggleDark }) => {
  const { t, i18n } = useTranslation();
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
              <img src={item.icon} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }} />
              {t(item.label)}
            </NavLink>
          ))}
        </div>

        {/* ── Right Side ── */}
        <div className="navbar-right">
          {/* Streak pill */}
          {streak > 0 && (
            <div className="navbar-streak">
              <img src="https://img.icons8.com/fluency/24/fire-element.png" alt="fire" style={{ width: '16px', height: '16px' }} />
              <span>{streak}</span>
            </div>
          )}

          {/* Dark toggle */}
          <button className="dark-toggle" onClick={onToggleDark} title={darkMode ? 'Light mode' : 'Dark mode'} aria-label="Toggle Dark Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Lang toggle */}
          {/* <button className="dark-toggle" onClick={toggleLang} title="Translate" aria-label="Toggle Language" style={{ fontSize: '16px', marginLeft: '8px', marginRight: '8px' }}>
            {i18n.language === 'en' ? '🇮🇳' : '🇺🇸'}
          </button> */}

          {/* Notifications */}
          <div className="navbar-user" ref={notifRef} style={{ marginRight: '16px' }}>
            <button className="dark-toggle" aria-label="Notifications" aria-expanded={notifOpen} onClick={() => { setNotifOpen(!notifOpen); if(!notifOpen) fetchNotifications(); }} style={{ position: 'relative' }}>
              🔔
              {notifications.some(n => !n.read) && <div style={{ position: 'absolute', top: '0px', right: '0px', width: '8px', height: '8px', borderRadius: '50%', background: 'red' }}></div>}
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
                  <img src="https://img.icons8.com/fluency/24/dashboard.png" alt="" style={{ width: '16px' }} /> {t('Dashboard')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/subjects'); }}>
                  <img src="https://img.icons8.com/fluency/24/books.png" alt="" style={{ width: '16px' }} /> {t('Browse Subjects')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/roadmap'); }}>
                  <img src="https://img.icons8.com/fluency/24/map.png" alt="" style={{ width: '16px' }} /> {t('Study Plan')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/leaderboard'); }}>
                  <img src="https://img.icons8.com/fluency/24/prize.png" alt="" style={{ width: '16px' }} /> {t('Ranking')}
                </button>
                <button className="dropdown-item" onClick={() => { setDropOpen(false); navigate('/resume'); }}>
                  <img src="https://img.icons8.com/fluency/24/resume.png" alt="" style={{ width: '16px' }} /> Resume AI
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                  <img src="https://img.icons8.com/fluency/24/exit.png" alt="" style={{ width: '16px' }} /> {t('Sign Out')}
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
