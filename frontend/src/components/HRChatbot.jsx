import React, { useState, useRef, useEffect } from 'react';

const HRChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "👋 Hi! I'm your HR AI Assistant. Ask me anything about employee attrition, retention, top talent, or HR strategies. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/advanced/chat/suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/advanced/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: data.response,
        insights: data.insights,
        recommendations: data.recommendations,
        intent: data.intent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0D1B2A' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        borderBottom: '2px solid #667eea'
      }}>
        <h2 style={{ margin: '0 0 4px 0' }}>💬 HR AI Assistant</h2>
        <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
          Ask about attrition, retention strategies, talent, compensation, and more
        </p>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && suggestions.length > 0 && (
        <div style={{
          padding: '16px',
          background: '#1B2E45',
          borderBottom: '1px solid #2D3E52',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <p style={{ color: '#8BA5BF', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
            💡 Try asking:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {suggestions.slice(0, 6).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: '10px 12px',
                  background: '#2D3E52',
                  color: '#00C9A7',
                  border: '1px solid #3D4E62',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.3s',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3D4E62';
                  e.target.style.borderColor = '#00C9A7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2D3E52';
                  e.target.style.borderColor = '#3D4E62';
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                background: message.type === 'user' ? '#2D3E52' : '#667eea20',
                border: message.type === 'user' ? '1px solid #667eea' : '1px solid #667eea',
                borderRadius: '12px',
                padding: '12px 16px',
                color: message.type === 'user' ? '#00C9A7' : '#E5E7EB',
              }}
            >
              <p style={{ margin: '0 0 4px 0', lineHeight: '1.5' }}>
                {message.text}
              </p>

              {/* Insights */}
              {message.insights && message.insights.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3D4E62' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#F59E0B', fontWeight: '500' }}>
                    📊 Key Insights:
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '0.85rem', opacity: 0.9 }}>
                    {message.insights.map((insight, idx) => (
                      <li key={idx} style={{ margin: '4px 0' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3D4E62' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#10B981', fontWeight: '500' }}>
                    ✅ Recommendations:
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '0.85rem', opacity: 0.9 }}>
                    {message.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} style={{ margin: '4px 0' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p style={{
                margin: '8px 0 0 0',
                fontSize: '0.75rem',
                opacity: 0.6,
                color: message.type === 'user' ? '#8BA5BF' : '#8BA5BF'
              }}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '4px' }}>
            <div style={{
              background: '#667eea30',
              border: '1px solid #667eea',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#8BA5BF'
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span>🤔 Thinking</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#667eea',
                        animation: `bounce 1.4s infinite`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        background: '#1B2E45',
        borderTop: '1px solid #2D3E52',
        display: 'flex',
        gap: '12px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Ask about attrition, retention, talent..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: '#0D1B2A',
            border: '1px solid #2D3E52',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#2D3E52'}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            background: loading || !input.trim() ? '#555' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) e.target.style.background = '#5568d3';
          }}
          onMouseLeave={(e) => {
            if (!loading && input.trim()) e.target.style.background = '#667eea';
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
};

export default HRChatbot;
