import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './LandingPage.css';

/* ═══════════════════════ STATIC DATA ═══════════════════════ */
/* CDN base — Icons8 Fluency style (colorful, high-quality PNGs) */
const I8 = 'https://img.icons8.com/fluency/96';
/* Devicons CDN for programming language logos */
const DV = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';

const FEATURES = [
  { img: `${I8}/brain.png`, title: 'Adaptive Testing Engine', gradient: 'linear-gradient(135deg,#F97316,#EA580C)', desc: 'Questions dynamically adjust difficulty using the SM-2 algorithm — tracking correctness and response speed in real time.' },
  { img: `${I8}/combo-chart.png`, title: 'Real-Time Analytics', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', desc: 'Accuracy metrics, capability scores, subject mastery radar charts, and historical score trend visualisations.' },
  { img: `${I8}/chatbot.png`, title: 'AI Chatbot & Doubt Support', gradient: 'linear-gradient(135deg,#10B981,#059669)', desc: 'Context-aware OpenAI-powered assistant for instant doubt clarification, concept breakdowns, and study guidance.' },
  { img: `${I8}/resume.png`, title: 'Resume Analyser', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', desc: 'AI-powered resume parsing with ATS score, skill gap detection, and a personalised improvement roadmap.' },
  { img: `${I8}/time-management.png`, title: 'Spaced Repetition (SRS)', gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', desc: 'SM-2 spaced repetition schedules reviews at the perfect moment for optimal long-term retention.' },
  { img: `${I8}/trophy.png`, title: 'Leaderboards & Badges', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', desc: 'Compete globally, earn achievement badges, build daily streaks, and get milestone notifications.' },
  { img: `${I8}/job.png`, title: 'Mock Interview System', gradient: 'linear-gradient(135deg,#EF4444,#B91C1C)', desc: 'AI-generated technical interviews with real-time evaluation, detailed feedback, and improvement tips.' },
  { img: `${I8}/dna-helix.png`, title: 'Learning DNA Analysis', gradient: 'linear-gradient(135deg,#14B8A6,#0F766E)', desc: 'Behavioural analytics that map your learning patterns, patience levels, and cognitive preferences.' },
  { img: `${I8}/youtube-play.png`, title: 'YouTube & NPTEL Courses', gradient: 'linear-gradient(135deg,#F97316,#8B5CF6)', desc: 'Curated content and free IIT/IISc certified NPTEL courses recommended based on your weak areas.' },
];

const SUBJECTS = [
  { name: 'Data Structures', img: `${I8}/tree-structure.png` },
  { name: 'DBMS', img: `${I8}/database.png` },
  { name: 'Operating Systems', img: `${I8}/linux.png` },
  { name: 'Python', img: `${DV}/python/python-original.svg` },
  { name: 'Machine Learning', img: `${I8}/machine-learning.png` },
  { name: 'Java', img: `${DV}/java/java-original.svg` },
  { name: 'Cloud Computing', img: `${I8}/cloud.png` },
  { name: 'Computer Networks', img: `${I8}/network.png` },
  { name: 'Algorithms', img: `${I8}/algorithm.png` },
  { name: 'IoT', img: `${I8}/iot-sensor.png` },
  { name: 'OOP (C++)', img: `${DV}/cplusplus/cplusplus-original.svg` },
  { name: 'Web Technologies', img: `${DV}/html5/html5-original.svg` },
  { name: 'C Programming', img: `${DV}/c/c-original.svg` },
  { name: 'Discrete Maths', img: `${I8}/math.png` },
  { name: 'DCN', img: `${I8}/networking-manager.png` },
];

const STATS = [
  { value: 19, suffix: '+', label: 'CSE Subjects' },
  { value: 5000, suffix: '+', label: 'Questions' },
  { value: 4, suffix: '', label: 'Difficulty Levels' },
  { value: 100, suffix: '%', label: 'Free Forever' },
];

const STEPS = [
  { num: '01', img: `${I8}/add-user-male.png`, title: 'Register Free', desc: 'Create your account in 30 seconds. Choose your interests and capability level.' },
  { num: '02', img: `${I8}/books.png`, title: 'Pick a Subject', desc: 'Choose from 19 CSE subjects — DSA, DBMS, OS, ML, Python, Java, and more.' },
  { num: '03', img: `${I8}/lightning-bolt.png`, title: 'Take Adaptive Test', desc: 'AI adjusts difficulty in real-time based on your accuracy and response speed.' },
  { num: '04', img: `${I8}/increase.png`, title: 'Track & Improve', desc: 'Review analytics, get recommendations, earn badges, and level up your skills.' },
];

const TESTIMONIALS = [
  { name: 'Pranav Chavan', role: 'Final Year CSE, TKIET Kolhapur', initials: 'PC', color: '#F97316', text: 'The adaptive testing is incredible — it finds my weak spots and drills them until I improve. My DBMS score jumped from 45 to 89 in two weeks!', rating: 5 },
  { name: 'Riya Jadhav', role: 'SY CSE, TKIET Kolhapur', initials: 'RJ', color: '#8B5CF6', text: 'The resume analyser gave me a detailed ATS score and told me exactly what to fix. Got shortlisted for 3 companies after updating it.', rating: 5 },
  { name: 'Ganesh Bachate', role: 'Final Year CSE, TKIET Kolhapur', initials: 'GB', color: '#10B981', text: 'The spaced repetition system reminded me to review exactly when I was about to forget concepts. My retention improved massively before exams.', rating: 5 },
];

const FOOTER_LINKS = {
  Platform: [{ label: 'Take a Test', path: '/subjects' }, { label: 'Practice Mode', path: '/subjects' }, { label: 'Leaderboard', path: '/leaderboard' }, { label: 'Daily Challenges', path: '/challenges' }, { label: 'Learning DNA', path: '/dna' }],
  'AI Tools': [{ label: 'Resume Analyser', path: '/resume' }, { label: 'Mock Interviews', path: '/subjects' }, { label: 'AI Chatbot', path: '/dashboard' }, { label: 'Code Evaluator', path: '/project' }, { label: 'Explanation Mode', path: '/explain' }],
  Subjects: [{ label: 'Data Structures', path: '/subjects' }, { label: 'DBMS', path: '/subjects' }, { label: 'Machine Learning', path: '/subjects' }, { label: 'Python', path: '/subjects' }, { label: 'View All →', path: '/subjects' }],
};

const TRUST_PILLS = [
  { img: `${I8}/lock-2.png`, text: 'Secure' },
  { img: `${I8}/good-quality.png`, text: '100% Free' },
  { img: `${I8}/smartphone-tablet.png`, text: 'Mobile Ready' },
  { img: `${I8}/artificial-intelligence.png`, text: 'OpenAI Powered' },
  { img: `${I8}/graduation-cap.png`, text: 'NPTEL Integrated' },
];

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */
function StatItem({ value, suffix, label, started }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTs = null;
    const duration = 2000;
    function tick(ts) {
      if (!startTs) startTs = ts;
      const pct = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setCount(Math.floor(ease * value));
      if (pct < 1) requestAnimationFrame(tick);
      else setCount(value);
    }
    requestAnimationFrame(tick);
  }, [started, value]);
  return (
    <div className="lp-stat-item">
      <div className="lp-stat-number">{count}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function Stars({ n }) {
  return (
    <div className="lp-stars">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const statsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.25 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const go = (path) => navigate(path);
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <div className="lp-root">

      {/* ───── NAVBAR ───── */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <div className="lp-brand-logo">
              <img src="/logo.png" alt="" className="lp-brand-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <div className="lp-brand-name">CodeMentorAI</div>
            </div>
          </div>

          <div className="lp-nav-links">
            {[['Features', 'features'], ['Subjects', 'subjects'], ['How It Works', 'how-it-works'], ['Reviews', 'testimonials']].map(([label, id]) => (
              <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>

          <div className="lp-nav-cta">
            <button className="lp-btn lp-btn-ghost" onClick={() => go('/login')}>Log In</button>
            <button className="lp-btn lp-btn-primary" onClick={() => go('/register')}>
              Get Started Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>

          <button className="lp-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
          </button>
        </div>

        {menuOpen && (
          <div className="lp-mobile-menu">
            {[['Features', 'features'], ['Subjects', 'subjects'], ['How It Works', 'how-it-works'], ['Reviews', 'testimonials']].map(([l, id]) => (
              <button key={id} className="lp-mobile-link" onClick={() => scrollTo(id)}>{l}</button>
            ))}
            <div className="lp-mobile-cta">
              <button className="lp-btn lp-btn-ghost" style={{ width: '100%' }} onClick={() => { go('/login'); setMenuOpen(false); }}>Log In</button>
              <button className="lp-btn lp-btn-primary" style={{ width: '100%' }} onClick={() => { go('/register'); setMenuOpen(false); }}>Get Started Free →</button>
            </div>
          </div>
        )}
      </nav>

      {/* ───── HERO ───── */}
      <section className="lp-hero">
        <div className="lp-hero-bg-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-content">
          {/* Left */}
          <div className="lp-hero-inner">
            <div className="lp-hero-badge">
              <span className="lp-badge-pulse" />
              <img src={`${I8}/rocket.png`} alt="" width="16" height="16" style={{ objectFit: 'contain' }} />
              AI-Powered · Free Forever · No Sign-up Fees
            </div>

            <h1 className="lp-hero-h1">
              Master <span className="lp-grad-text">Computer Science</span> the Smarter Way
            </h1>

            <p className="lp-hero-sub">
              The only adaptive learning platform built exclusively for CSE students.
              AI-powered tests, real-time analytics, resume analysis, and NPTEL course
              recommendations — all in one place, completely free.
            </p>

            <div className="lp-hero-actions">
              <button className="lp-btn lp-btn-primary lp-btn-xl" onClick={() => go('/register')}>
                <img src={`${I8}/lightning-bolt.png`} alt="" width="20" height="20" style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                Start Learning Free
              </button>
              <button className="lp-btn lp-btn-outline lp-btn-xl" onClick={() => go('/login')}>
                Already have an account? Sign In
              </button>
            </div>

            <div className="lp-hero-trust">
              {TRUST_PILLS.map(t => (
                <span key={t.text} className="lp-trust-pill">
                  <img src={t.img} alt={t.text} width="15" height="15" style={{ objectFit: 'contain' }} />
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right: demo card */}
          <div className="lp-hero-visual">
            <div className="lp-demo-card">
              <div className="lp-demo-header">
                <div className="lp-demo-dots">
                  <span style={{ background: '#EF4444' }} />
                  <span style={{ background: '#F59E0B' }} />
                  <span style={{ background: '#10B981' }} />
                </div>
                <span className="lp-demo-title">
                  <img src={`${I8}/lightning-bolt.png`} alt="" width="13" height="13" style={{ objectFit: 'contain', verticalAlign: 'middle', marginRight: '4px' }} />
                  Adaptive Test — Python · Q4/10
                </span>
              </div>
              <div className="lp-demo-body">
                <div className="lp-demo-diff-row">
                  <span className="lp-pill lp-pill-easy">Easy</span>
                  <div className="lp-diff-bar"><div className="lp-diff-fill" style={{ width: '70%' }} /></div>
                  <span className="lp-pill lp-pill-hard">Hard</span>
                </div>
                <p className="lp-demo-q">What is the time complexity of Python's <code>list.append()</code>?</p>
                <div className="lp-demo-opts">
                  {['O(1) amortised', 'O(n)', 'O(log n)', 'O(n²)'].map((o, i) => (
                    <div key={i} className={`lp-demo-opt${i === 0 ? ' lp-opt-correct' : ''}`}>{o}</div>
                  ))}
                </div>
                <div className="lp-demo-result">
                  <span className="lp-result-icon">✓</span>
                  Correct! Difficulty increasing → Moderate
                </div>
              </div>
            </div>

            {/* Floating badge cards */}
            <div className="lp-badge-float lp-badge-float--tl">
              <img src={`${I8}/fire-element.png`} alt="streak" className="lp-badge-float-img" />
              <div>
                <div className="lp-badge-float-title">12 Day Streak</div>
                <div className="lp-badge-float-sub">Personal Best!</div>
              </div>
            </div>
            <div className="lp-badge-float lp-badge-float--br">
              <img src={`${I8}/trophy.png`} alt="trophy" className="lp-badge-float-img" />
              <div>
                <div className="lp-badge-float-title">Score: 92/100</div>
                <div className="lp-badge-float-sub">Advanced · Top 5%</div>
              </div>
            </div>
            <div className="lp-badge-float lp-badge-float--bl">
              <img src={`${I8}/artificial-intelligence.png`} alt="ai" className="lp-badge-float-img" />
              <div>
                <div className="lp-badge-float-title">AI Recommendations</div>
                <div className="lp-badge-float-sub">3 NPTEL courses ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── STATS BAND ───── */}
      <section className="lp-stats-band" ref={statsRef}>
        <div className="lp-stats-inner">
          {STATS.map(s => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} started={statsVisible} />
          ))}
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section id="features" className="lp-section">
        <div className="lp-section-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">Everything You Need</div>
            <h2 className="lp-section-h2">Packed with <span className="lp-grad-text">AI-powered</span> learning tools</h2>
            <p className="lp-section-desc">From adaptive quizzes to resume ATS analysis — a complete CSE learning ecosystem.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-feature-card" key={i} style={{ '--card-delay': `${i * 55}ms` }}>
                <div className="lp-feature-icon" style={{ background: f.gradient }}>
                  <img src={f.img} alt={f.title} className="lp-feature-img" />
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
                <div className="lp-feature-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── SUBJECTS ───── */}
      <section id="subjects" className="lp-section lp-section-tinted">
        <div className="lp-section-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">15+ CSE Topics</div>
            <h2 className="lp-section-h2">Every subject you need to <span className="lp-grad-text">ace your interviews</span></h2>
            <p className="lp-section-desc">5000+ questions covering all core and elective CSE subjects.</p>
          </div>
          <div className="lp-subjects-wrap">
            {SUBJECTS.map(s => (
              <button key={s.name} className="lp-subject-chip" onClick={() => go('/register')}>
                <img src={s.img} alt={s.name} className="lp-subject-img" />
                <span>{s.name}</span>
              </button>
            ))}
            <button className="lp-subject-chip lp-subject-more" onClick={() => go('/register')}>+ 4 More</button>
          </div>
          <div className="lp-subjects-cta">
            <button className="lp-btn lp-btn-primary" onClick={() => go('/register')}>Explore All Subjects →</button>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how-it-works" className="lp-section">
        <div className="lp-section-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">Simple Process</div>
            <h2 className="lp-section-h2">Up and running in <span className="lp-grad-text">under 2 minutes</span></h2>
            <p className="lp-section-desc">No complex setup. Register, pick a subject, and start learning immediately.</p>
          </div>
          <div className="lp-steps-row">
            {STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div className="lp-step">
                  <div className="lp-step-badge"><span className="lp-step-num">{step.num}</span></div>
                  <div className="lp-step-icon-wrap">
                    <img src={step.img} alt={step.title} className="lp-step-img" />
                  </div>
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-connector">
                    <div className="lp-connector-line" />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--orange-400)', flexShrink: 0 }}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div className="lp-connector-line" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section id="testimonials" className="lp-section lp-section-tinted">
        <div className="lp-section-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">Student Reviews</div>
            <h2 className="lp-section-h2">Loved by <span className="lp-grad-text">CSE students</span> across India</h2>
            <p className="lp-section-desc">Real feedback from students who improved scores and landed internships.</p>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`lp-testimonial-card${i === activeTestimonial ? ' lp-testimonial-card--active' : ''}`}
                onClick={() => setActiveTestimonial(i)}
              >
                <Stars n={t.rating} />
                <p className="lp-testimonial-text">"{t.text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} className={`lp-dot${i === activeTestimonial ? ' lp-dot--active' : ''}`} onClick={() => setActiveTestimonial(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA BAND ───── */}
      <section className="lp-cta-band">
        <div className="lp-cta-orb lp-cta-orb-1" />
        <div className="lp-cta-orb lp-cta-orb-2" />
        <div className="lp-cta-inner">
          <div className="lp-cta-eyebrow">
            <img src={`${I8}/graduation-cap.png`} alt="" width="20" height="20" style={{ objectFit: 'contain', verticalAlign: 'middle', marginRight: '6px' }} />
            Join thousands of students
          </div>
          <h2 className="lp-cta-h2">Ready to ace your CSE interviews?</h2>
          <p className="lp-cta-sub">Start your adaptive learning journey today — completely free, no credit card required.</p>
          <div className="lp-cta-actions">
            <button className="lp-btn lp-btn-white lp-btn-xl" onClick={() => go('/register')}>Create Free Account →</button>
            <button className="lp-btn lp-btn-outline-white lp-btn-xl" onClick={() => go('/login')}>Sign In</button>
          </div>
          <div className="lp-cta-reassurance">
            <span>✓ Free forever</span>
            <span>✓ No credit card</span>
            <span>✓ Instant access</span>
            <span>✓ 19 subjects</span>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-col">
            <div className="lp-footer-brand">
              <div className="lp-brand-logo">
                <img src="/logo.png" alt="" className="lp-brand-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div>
                <div className="lp-brand-name" style={{ fontSize: '17px' }}>CodeMentorAI</div>
                <div className="lp-brand-sub">Adaptive Learning Platform</div>
              </div>
            </div>
            <p className="lp-footer-tagline">
              AI-Driven Adaptive Testing &amp; Learning Platform built exclusively for CSE students.
              Powered by OpenAI, MongoDB Atlas, and a passion for great education. ❤️
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div className="lp-footer-col" key={section}>
              <h4 className="lp-footer-col-title">{section}</h4>
              <ul className="lp-footer-links-list">
                {links.map(l => (
                  <li key={l.label}>
                    <button className="lp-footer-link" onClick={() => go(l.path)}>{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Get Started</h4>
            <div className="lp-footer-auth-cards">
              <button className="lp-footer-auth-btn lp-footer-auth-btn--primary" onClick={() => go('/register')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                Create Free Account
              </button>
              <button className="lp-footer-auth-btn lp-footer-auth-btn--ghost" onClick={() => go('/login')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                Sign In
              </button>
            </div>
          </div>
        </div>

        <div className="lp-footer-divider" />

        <div className="lp-footer-bottom">
          <div className="lp-footer-bottom-left">
            <span>© {new Date().getFullYear()} CodeMentorAI — AI-Driven Adaptive Testing &amp; Learning Platform</span>
          </div>
          <div className="lp-footer-bottom-right">
            <span className="lp-footer-status">
              <span className="lp-status-dot" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
