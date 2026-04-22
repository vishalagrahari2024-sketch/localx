import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { connectSocket, getSocket } from '../utils/socket';
import CreateGroupChatModal from '../components/CreateGroupChatModal';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
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

  const getConversationDetails = (conv) => {
    if (!conv) return {};
    if (conv.isGroup) {
      return {
        name: conv.name || 'Group Chat',
        avatar: conv.groupAvatar || null,
        initial: (conv.name || 'G')[0].toUpperCase(),
        isGroup: true,
      };
    }
    const other = conv.participants?.find(p => p._id !== myProfile?._id) || {};
    return {
      name: other.name || 'User',
      avatar: other.avatar || null,
      initial: other.name?.[0]?.toUpperCase() || '?',
      isGroup: false,
    };
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
    <div className="main-content">
      <div className="messages-layout max-w-6xl mx-auto h-[calc(100vh-6rem)] flex rounded-2xl overflow-hidden glass-panel border border-[var(--border-color)]">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar w-64 md:w-72 shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
          <div className="sidebar-header p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Messages</h2>
            <button
              onClick={() => setShowGroupModal(true)}
              className="w-8 h-8 rounded-full bg-[var(--bg-color)] hover:bg-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center transition-colors"
              title="Create Group Chat"
            >
              +
            </button>
          </div>
          <div className="conversations-list overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <p className="empty-text p-6 text-center text-[var(--text-secondary)]">No conversations yet</p>
            ) : (
              conversations.map(conv => {
                const details = getConversationDetails(conv);
                return (
                  <div
                    key={conv._id}
                    className={`conversation-item flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-color)] transition-colors border-b border-[var(--border-color)] ${activeConversation?._id === conv._id ? 'bg-[var(--bg-color)] border-l-4 border-l-[var(--primary-color)]' : ''}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className={`conv-avatar w-12 h-12 rounded-full ${details.isGroup ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-sky-400 to-indigo-500'} flex items-center justify-center shrink-0 overflow-hidden`}>
                      {details.avatar ? (
                        <img src={details.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="avatar-placeholder text-white font-bold">{details.initial}</span>
                      )}
                    </div>
                    <div className="conv-info flex-1 overflow-hidden">
                      <h4 className="font-bold text-[var(--text-primary)] truncate">{details.name}</h4>
                      <p className="conv-last-msg text-sm text-[var(--text-secondary)] truncate">{conv.lastMessage || 'Start chatting...'}</p>
                    </div>
                    <span className="conv-time text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {conv.lastMessageAt && new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area flex-1 flex flex-col bg-[var(--bg-color)] relative">
          {activeConversation ? (
            <>
              <div className="chat-header p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between shadow-sm z-10">
                <div className="chat-user-info flex items-center gap-3">
                  <span className={`avatar-placeholder w-10 h-10 rounded-full ${activeConversation?.isGroup ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)]'} text-white flex items-center justify-center font-bold`}>
                    {getConversationDetails(activeConversation).initial}
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{getConversationDetails(activeConversation).name}</h3>
                    {typingUser && <span className="typing-indicator text-xs text-[var(--primary-color)] font-medium inline-block animate-pulse">{typingUser} is typing...</span>}
                  </div>
                </div>
              </div>

              <div className="chat-messages flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                {messages.map((msg, i) => (
                  <div
                    key={msg._id || i}
                    className={`message-bubble max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${msg.senderId?._id === myProfile?._id || msg.senderId === myProfile?._id ? 'bg-[var(--primary-color)] text-white self-end rounded-br-sm' : 'bg-white dark:bg-gray-800 text-[var(--text-primary)] self-start rounded-bl-sm border border-[var(--border-color)]'}`}
                  >
                    <p className="mb-1">{msg.content}</p>
                    <div className="message-meta flex items-center justify-end gap-1 opacity-70 text-xs">
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

              <div className="chat-input-area p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onFocus={() => handleTyping(true)}
                  onBlur={() => handleTyping(false)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="chat-input flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-5 py-3 focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)] transition-colors"
                />
                <button onClick={sendMessage} className="send-btn w-12 h-12 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center hover:bg-opacity-90 disabled:opacity-50 transition-all flex-shrink-0" disabled={!newMessage.trim()}>
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
              <div className="placeholder-icon text-6xl mb-4 opacity-50 text-[var(--primary-color)]">💬</div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {showGroupModal && (
        <CreateGroupChatModal
          onClose={() => setShowGroupModal(false)}
          connections={[...(myProfile?.followers || []), ...(myProfile?.following || [])]}
          onSuccess={(newGroup) => {
            setShowGroupModal(false);
            setConversations(prev => [newGroup, ...prev]);
            selectConversation(newGroup);
          }}
        />
      )}
    </div>
  );
}
