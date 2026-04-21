import { useEffect, useRef } from 'react';

const useBehaviorTracking = ({ topic = '', action = 'page_view', isRevision = false } = {}) => {
  const mountTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    maxScrollRef.current = 0; // reset on topic change
    
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        if (scrollPercent > maxScrollRef.current) {
          maxScrollRef.current = scrollPercent;
        }
      } else {
        // No scrollbar means fully visible
        maxScrollRef.current = 100;
      }
    };

    // Initialize in case it doesn't scroll
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      const timeSpent = Math.floor((Date.now() - mountTimeRef.current) / 1000);
      const token = localStorage.getItem('token');
      
      // Only send if meaningful time spent
      if (token && timeSpent > 1) {
        fetch('http://localhost:5000/api/analytics/behavior', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            path: window.location.pathname,
            timeSpent: timeSpent,
            maxScrollDepth: Math.floor(maxScrollRef.current),
            action,
            topic,
            isRevision
          }),
          keepalive: true
        }).catch(err => console.debug('Behavior tracking failed silently', err));
      }
    };
  }, [topic, action, isRevision]);
};

export default useBehaviorTracking;
