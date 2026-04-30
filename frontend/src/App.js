import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login           from './components/Login';
import Register        from './components/Register';
import Dashboard       from './components/Dashboard';
import SubjectSelection from './components/SubjectSelection';
import TestInterface   from './components/TestInterface';
import Results         from './components/Results';
import PracticeMode    from './components/PracticeMode';
import Leaderboard     from './components/Leaderboard';
import MixedTestSetup   from './components/MixedTestSetup';
import Roadmap         from './components/Roadmap';
import FloatingChatbot from './components/FloatingChatbot';
import Navbar          from './components/Navbar';
import ExplanationMode from './components/ExplanationMode';
import ProjectTask     from './components/ProjectTask';
import Challenges      from './components/Challenges';
import LearningDNA     from './components/LearningDNA';
import ResumeAnalyser  from './components/ResumeAnalyser';
import './App.css';

function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak,  setStreak]  = useState(0);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  /* Apply dark mode to body */
  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loading">Loading…</div>;

  /* Wrap authenticated pages with the global Navbar */
  const withNav = (el) => user ? (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        streak={streak}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />
      {el}
      <FloatingChatbot />
    </>
  ) : <Navigate to="/login" />;

  /* Test & practice pages use their own full-screen header — no global nav */
  const authOnly = (el) => user ? (
    <>
      {el}
      <FloatingChatbot />
    </>
  ) : <Navigate to="/login" />;

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <Login    onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />

          {/* Authenticated + Navbar */}
          <Route path="/dashboard"  element={withNav(<Dashboard user={user} />)} />
          <Route path="/subjects"   element={withNav(<SubjectSelection user={user} />)} />
          <Route path="/leaderboard" element={withNav(<Leaderboard user={user} />)} />
          <Route path="/ranking"     element={withNav(<Leaderboard user={user} />)} />
          <Route path="/roadmap"    element={withNav(<Roadmap user={user} />)} />
          <Route path="/test/setup-mixed" element={withNav(<MixedTestSetup />)} />
          <Route path="/explain"    element={withNav(<ExplanationMode user={user} />)} />
          <Route path="/project"    element={withNav(<ProjectTask user={user} />)} />
          <Route path="/challenges" element={withNav(<Challenges user={user} />)} />
          <Route path="/dna"        element={withNav(<LearningDNA user={user} />)} />
          <Route path="/resume"     element={withNav(<ResumeAnalyser user={user} />)} />

          {/* Authenticated, full-screen (no nav — proctored / results) */}
          <Route path="/test/:subject"       element={authOnly(<TestInterface user={user} />)} />
          <Route path="/results/:testId"     element={authOnly(<Results user={user} />)} />
          <Route path="/practice/:subject"   element={authOnly(<PracticeMode user={user} />)} />

          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
