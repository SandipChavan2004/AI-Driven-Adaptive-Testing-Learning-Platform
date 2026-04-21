import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Vantage, your AI study assistant. How can I help you prepare today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const chatHistory = [...messages, userMsg];
    setMessages(chatHistory);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const isDoubt = input.includes('?') || /^(how|what|why|where|when|can you|explain)/i.test(input.trim());
      
      const res = await axios.post('http://localhost:5000/api/ai/chat', {
        message: userMsg.content,
        history: messages.slice(-4), // Send last 4 messages for context
        is_doubt: isDoubt
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMessages([...chatHistory, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...chatHistory, { role: 'assistant', content: '⚠️ Failed to reach AI. Please check your network connection or OPENAI_API_KEY.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={toggleChat}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: isOpen ? '#1C1917' : 'var(--grad)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
      >
        {isOpen ? (
          <img src="https://img.icons8.com/fluency-systems-regular/48/ffffff/multiply.png" alt="close" style={{ width: '24px' }} />
        ) : (
          <img src="https://img.icons8.com/fluency/48/chat.png" alt="chat" style={{ width: '28px' }} />
        )}
      </button>

      {/* Chat Window */}
      <div style={{
        position: 'fixed', bottom: '96px', right: '24px', zIndex: 9998,
        width: '350px', height: '500px', maxHeight: 'calc(100vh - 120px)',
        background: 'var(--surface)', borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        transformOrigin: 'bottom right'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--grad)', padding: '16px', color: 'white',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ background: 'white', borderRadius: '50%', padding: '4px', display: 'flex' }}>
            <img src="https://img.icons8.com/color/48/bot.png" alt="Vantage" style={{ width: '24px' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Vantage Assistant</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Online · AI Study Guide</div>
          </div>
        </div>

        {/* Message List */}
        <div style={{
          flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg)',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%', padding: '10px 14px', fontSize: '13px', lineHeight: '1.5',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--orange-500)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Ultra basic markdown rendering for AI responses */}
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: '13px' }}>
              <span className="dot-pulse">typing...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} style={{
          borderTop: '1px solid var(--border)', padding: '12px', background: 'white',
          display: 'flex', gap: '8px'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid var(--border)',
              outline: 'none', fontSize: '13px', background: 'var(--bg)'
            }}
          />
          <button type="submit" disabled={!input.trim() || loading} style={{
            background: input.trim() ? 'var(--orange-500)' : 'var(--text-muted)', color: 'white',
            border: 'none', borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s'
          }}>
            <img src="https://img.icons8.com/fluency-systems-filled/24/ffffff/sent.png" alt="send" style={{ width: '16px', marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    </>
  );
};

export default FloatingChatbot;
