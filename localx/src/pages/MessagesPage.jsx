import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { connectSocket, getSocket } from '../utils/socket';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [convRes, profileRes] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/users/me'),
        ]);
        setConversations(convRes.data || []);
        setMyProfile(profileRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  // Socket.IO for real-time messages
  useEffect(() => {
    const setup = async () => {
      const socket = await connectSocket();
      if (!socket) return;

      socket.on('new-message', ({ conversationId, message }) => {
        if (activeConversation?._id === conversationId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        // Update last message in conversation list
        setConversations(prev => prev.map(c =>
          c._id === conversationId
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        ));
      });

      socket.on('user-typing', ({ userId, userName, isTyping }) => {
        if (isTyping) setTypingUser(userName);
        else setTypingUser(null);
      });
    };
    setup();
  }, [activeConversation]);

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    try {
      const res = await api.get(`/messages/conversations/${conv._id}/messages`);
      setMessages(res.data.messages || []);
      scrollToBottom();

      // Join socket room
      const socket = getSocket();
      if (socket) socket.emit('join-conversation', conv._id);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const res = await api.post(`/messages/conversations/${activeConversation._id}/messages`, {
        content: newMessage.trim(),
      });

      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      scrollToBottom();

      // Update conversation list
      setConversations(prev => prev.map(c =>
        c._id === activeConversation._id
          ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date() }
          : c
      ));
    } catch (err) { console.error(err); }
  };

  const handleTyping = (isTyping) => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('typing', { conversationId: activeConversation._id, isTyping });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p._id !== myProfile?._id) || {};
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read': return '✓✓';
      case 'delivered': return '✓✓';
      case 'sent': return '✓';
      default: return '✓';
    }
  };

  if (loading) {
    return <div className="feed-loading"><div className="spinner"></div><p>Loading messages...</p></div>;
  }

  return (
    <div className="messages-layout">
      {/* Conversations Sidebar */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
        </div>
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <p className="empty-text">No conversations yet</p>
          ) : (
            conversations.map(conv => {
              const other = getOtherParticipant(conv);
              return (
                <div
                  key={conv._id}
                  className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {other.avatar ? (
                      <img src={other.avatar} alt="" />
                    ) : (
                      <span className="avatar-placeholder">{other.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="conv-info">
                    <h4>{other.name || 'User'}</h4>
                    <p className="conv-last-msg">{conv.lastMessage || 'Start chatting...'}</p>
                  </div>
                  <span className="conv-time">
                    {conv.lastMessageAt && new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <span className="avatar-placeholder">
                  {getOtherParticipant(activeConversation).name?.[0] || '?'}
                </span>
                <div>
                  <h3>{getOtherParticipant(activeConversation).name || 'User'}</h3>
                  {typingUser && <span className="typing-indicator">{typingUser} is typing...</span>}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={msg._id || i}
                  className={`message-bubble ${msg.senderId?._id === myProfile?._id || msg.senderId === myProfile?._id ? 'sent' : 'received'}`}
                >
                  <p>{msg.content}</p>
                  <div className="message-meta">
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(msg.senderId?._id === myProfile?._id || msg.senderId === myProfile?._id) && (
                      <span className={`message-status ${msg.status}`}>
                        {getStatusIcon(msg.status)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onFocus={() => handleTyping(true)}
                onBlur={() => handleTyping(false)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="chat-input"
              />
              <button onClick={sendMessage} className="send-btn" disabled={!newMessage.trim()}>
                ➤
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
