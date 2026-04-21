import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

/* 12-month activity heatmap. Each month renders only its real dates. */
const DAYS_PER_COLUMN = 7;
const MONTHS_TO_SHOW = 12;

const DAY_LABELS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getColor = (count) => {
  if (count === 0) return 'var(--streak-0)';
  if (count === 1) return 'var(--streak-1)';
  if (count <= 3) return 'var(--streak-2)';
  if (count <= 5) return 'var(--streak-3)';
  return 'var(--streak-4)';
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StreakCalendar = ({ fullWidth = false }) => {
  const [activityMap, setActivityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/user/activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivityMap(res.data.activity || {});
      setTotal(res.data.total_tests || 0);
    } catch {
      // Graceful fallback: show an empty calendar if activity cannot load.
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);

  const months = [];
  for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = formatDateKey(date);
      days.push({
        key,
        count: activityMap[key] || 0,
        isToday: key === todayKey,
      });
    }

    months.push({
      key: `${year}-${month}`,
      label: `${MONTH_NAMES[month]} ${String(year).slice(-2)}`,
      daysInMonth,
      days,
    });
  }

  if (loading) return null;

  const cellSize = fullWidth ? '16px' : '14px';
  const cellGap = fullWidth ? '4px' : '3px';
  const labelWidth = fullWidth ? '34px' : '22px';
  const calendarMinWidth = fullWidth ? '1080px' : 'auto';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto', paddingBottom: fullWidth ? '6px' : 0 }}>
        <div style={{
          minWidth: calendarMinWidth,
          display: 'flex',
          alignItems: 'flex-start',
          gap: fullWidth ? '12px' : '8px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: cellGap, paddingTop: fullWidth ? '23px' : '20px', flexShrink: 0 }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} style={{
                height: cellSize,
                width: labelWidth,
                color: 'var(--text-muted)',
                fontSize: fullWidth ? '10px' : '9px',
                lineHeight: cellSize,
                textAlign: 'right',
              }}>
                {label}
              </div>
            ))}
          </div>

          {months.map(month => (
            <div key={month.key} style={{ flexShrink: 0 }}>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: fullWidth ? '11px' : '10px',
                fontWeight: 700,
                marginBottom: '6px',
              }}>
                {month.label}
                <span style={{ marginLeft: 4, fontWeight: 600 }}>({month.daysInMonth})</span>
              </div>

              <div style={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridTemplateRows: `repeat(${DAYS_PER_COLUMN}, ${cellSize})`,
                gridAutoColumns: cellSize,
                gap: cellGap,
              }}>
                {month.days.map(cell => (
                  <div
                    key={cell.key}
                    title={`${cell.key}: ${cell.count} test${cell.count !== 1 ? 's' : ''}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: '3px',
                      background: getColor(cell.count),
                      border: cell.isToday ? '2px solid var(--orange-500)' : '1px solid rgba(0,0,0,0.04)',
                      cursor: 'default',
                      transition: 'transform 0.12s',
                    }}
                    onMouseEnter={e => { e.target.style.transform = 'scale(1.4)'; e.target.style.zIndex = 10; }}
                    onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.zIndex = 1; }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{total} tests in the last 12 months</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Less</span>
          {['var(--streak-0)', 'var(--streak-1)', 'var(--streak-2)', 'var(--streak-3)', 'var(--streak-4)'].map((color, i) => (
            <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: color, border: '1px solid rgba(0,0,0,0.06)' }} />
          ))}
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendar;
