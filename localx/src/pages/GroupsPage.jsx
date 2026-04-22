import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { connectSocket, getSocket } from '../utils/socket';
import GroupInfoModal from '../components/GroupInfoModal';

export default function GroupsPage() {
  const { groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'other' });

  // Group specific states
  const [activeTab, setActiveTab] = useState('chat');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setMyProfile(res.data);
      } catch (err) { console.error(err); }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (groupId) {
          const res = await api.get(`/groups/${groupId}`);
          setGroup(res.data);
          
          // Fetch messages and posts in parallel
          const [msgRes, postsRes] = await Promise.all([
            api.get(`/groups/${groupId}/messages`).catch(() => ({ data: { messages: [] } })),
            api.get(`/groups/${groupId}/posts`).catch(() => ({ data: [] }))
          ]);
          setMessages(msgRes.data.messages || []);
          setPosts(postsRes.data || []);
        } else {
          const res = await api.get('/groups');
          setGroups(res.data || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [groupId]);

  // Socket.io for group chat
  useEffect(() => {
    if (!groupId) return;
    const setup = async () => {
      const socket = await connectSocket();
      if (!socket) return;
      
      // We assume socket logic to join room exists or we can just listen
      socket.emit('join-group', groupId); // Optional if backend supports joining group rooms manually
      
      socket.on('new-group-message', ({ groupId: msgGroupId, message }) => {
        if (msgGroupId === groupId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });
    };
    setup();
    
    return () => {
      const socket = getSocket();
      if (socket) socket.off('new-group-message');
    }
  }, [groupId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      scrollToBottom();
    }
  }, [activeTab, messages.length]);

  const handleCreate = async () => {
    if (!newGroup.name.trim()) return;
    try {
      const res = await api.post('/groups', newGroup);
      setGroups(prev => [res.data.group, ...prev]);
      setShowCreate(false);
      setNewGroup({ name: '', description: '', category: 'other' });
    } catch (err) { console.error(err); }
  };

  const handleJoin = async (gId) => {
    try {
      await api.post(`/groups/${gId}/join`);
      setGroups(prev => prev.map(g => g._id === gId ? { ...g, joined: true } : g));
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId) return;
    try {
      const res = await api.post(`/groups/${groupId}/messages`, { content: newMessage.trim() });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) { 
      console.error(err);
      alert('Error sending message: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="feed-loading"><div className="spinner"></div></div>;

  // Group Detail View (Insta-style Chat/Posts)
  if (groupId && group) {
    const isMember = group.members?.some(m => m.userId?._id === myProfile?._id || m.userId === myProfile?._id);

    return (
      <div className="main-content flex justify-center">
        <div className="w-full max-w-4xl h-[calc(100vh-6rem)] flex flex-col bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden glass-panel shadow-sm relative">
          
          {/* Insta-style Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
            onClick={() => setShowInfoModal(true)}
          >
            <div className="flex items-center gap-3">
              {/* Stacked Member Logos */}
              <div className="flex -space-x-3">
                {group.members?.slice(0, 3).map((m, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-color)] bg-gradient-to-br from-emerald-400 to-teal-500 overflow-hidden flex items-center justify-center shrink-0 z-10" style={{ zIndex: 10 - i }}>
                    {m.userId?.avatar ? (
                      <img src={m.userId.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{m.userId?.name?.[0] || '?'}</span>
                    )}
                  </div>
                ))}
                {group.members?.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-color)] bg-[var(--border-color)] flex items-center justify-center shrink-0 text-xs text-[var(--text-secondary)] font-medium z-0">
                    +{group.members.length - 3}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-[var(--text-primary)] text-lg leading-tight">{group.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{group.members?.length} members • {group.category}</p>
              </div>
            </div>
            <div className="text-[var(--text-secondary)]">
              <span className="text-xl">⋮</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat Room
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts Feed
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-[var(--bg-color)]">
            {!isMember ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[var(--bg-color)]/80 backdrop-blur-sm">
                <div className="text-5xl mb-4 opacity-50">🔒</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Private Group</h3>
                <p className="text-[var(--text-secondary)] mb-6">Join this group to participate in the chat and view posts.</p>
                <button onClick={() => handleJoin(group._id)} className="btn-primary">Join Group</button>
              </div>
            ) : null}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                  {messages.length === 0 ? (
                    <div className="text-center text-[var(--text-secondary)] my-auto opacity-70">
                      Say hi to the group! 👋
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId?._id === myProfile?._id || msg.senderId === myProfile?._id;
                      return (
                        <div key={msg._id || i} className={`flex max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'} gap-2`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] shrink-0 overflow-hidden mt-1">
                              {msg.senderId?.avatar ? (
                                <img src={msg.senderId.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-xs font-bold flex items-center justify-center h-full">
                                  {msg.senderId?.name?.[0] || '?'}
                                </span>
                              )}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <span className="text-xs text-[var(--text-secondary)] ml-1 mb-1">{msg.senderId?.name}</span>}
                            <div className={`px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-[var(--primary-color)] text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm'}`}>
                              <p>{msg.content}</p>
                            </div>
                            <span className="text-[10px] text-[var(--text-secondary)] mt-1 mx-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Message the group..."
                    className="flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-4 py-2 focus:outline-none focus:border-[var(--primary-color)]"
                    disabled={!isMember}
                  />
                  <button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || !isMember}
                    className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center hover:bg-opacity-90 disabled:opacity-50 transition-colors shrink-0"
                  >
                    ➤
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="h-full overflow-y-auto p-6 bg-[var(--bg-color)]">
                {posts.length === 0 ? (
                  <div className="text-center text-[var(--text-secondary)] mt-10">
                    No posts in this group yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {posts.map(post => (
                      <div key={post._id} className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-bold">
                              {post.username?.[0] || '?'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[var(--text-primary)]">{post.username}</h4>
                              <p className="text-xs text-[var(--text-secondary)]">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">{post.text}</p>
                        {post.mediaUrl && (
                          <img src={post.mediaUrl} alt="Post media" className="mt-3 rounded-lg max-h-80 w-full object-cover border border-[var(--border-color)]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showInfoModal && <GroupInfoModal group={group} onClose={() => setShowInfoModal(false)} />}
      </div>
    );
  }

  // Groups List View
  return (
    <div className="main-content">
      <div className="groups-page max-w-5xl mx-auto">
        <div className="groups-header py-6 flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Groups</h1>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Group</button>
        </div>
        <div className="groups-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {groups.length === 0 ? (
            <div className="empty-text col-span-full text-center p-12 glass-panel text-[var(--text-secondary)]">No groups yet. Create one!</div>
          ) : groups.map(g => (
            <Link to={`/groups/${g._id}`} key={g._id} className="group-card glass-panel flex flex-col overflow-hidden hover:-translate-y-1 transition-transform">
              <div className="group-card-cover h-32 bg-gradient-to-r from-sky-400 to-indigo-500 relative flex items-center justify-center text-4xl" style={g.coverImage ? { backgroundImage: `url(${g.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!g.coverImage && <span className="group-card-icon">👥</span>}
              </div>
              <div className="group-card-body p-5 flex flex-col flex-1">
                <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">{g.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1">{g.description || 'No description'}</p>
                <div className="group-card-footer flex justify-between items-center pt-4 border-t border-[var(--border-color)] text-sm">
                  <span className="text-[var(--text-primary)] font-medium">{g.memberCount || g.members?.length || 0} members</span>
                  <span className={`category-badge bg-[var(--bg-color)] px-2 py-1 rounded text-xs text-[var(--primary-color)] capitalize`}>{g.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2>Create Group</h2><button onClick={() => setShowCreate(false)} className="close-btn">✕</button></div>
              <div className="modal-body">
                <label>Group Name</label>
                <input type="text" value={newGroup.name} onChange={e => setNewGroup(p => ({...p, name: e.target.value}))} className="form-input" placeholder="e.g. Coding Club" />
                <label>Description</label>
                <textarea value={newGroup.description} onChange={e => setNewGroup(p => ({...p, description: e.target.value}))} className="form-input" rows={3} />
                <label>Category</label>
                <select value={newGroup.category} onChange={e => setNewGroup(p => ({...p, category: e.target.value}))} className="form-select">
                  <option value="club">Club</option><option value="department">Department</option>
                  <option value="study">Study Circle</option><option value="event">Event</option><option value="other">Other</option>
                </select>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCreate} className="btn-primary" disabled={!newGroup.name.trim()}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
