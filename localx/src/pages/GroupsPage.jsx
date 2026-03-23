import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function GroupsPage() {
  const { groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'other' });

  useEffect(() => {
    const fetch = async () => {
      try {
        if (groupId) {
          const res = await api.get(`/groups/${groupId}`);
          setGroup(res.data);
        } else {
          const res = await api.get('/groups');
          setGroups(res.data || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [groupId]);

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

  if (loading) return <div className="feed-loading"><div className="spinner"></div></div>;

  // Group Detail View
  if (groupId && group) {
    return (
      <div className="group-detail">
        <div className="group-cover" style={group.coverImage ? { backgroundImage: `url(${group.coverImage})` } : {}}>
          <div className="group-cover-overlay"></div>
          <h1 className="group-title">{group.name}</h1>
        </div>
        <div className="group-meta">
          <p>{group.description}</p>
          <span>{group.memberCount || group.members?.length} members</span>
          <span className={`category-badge cat-${group.category}`}>{group.category}</span>
        </div>
        <div className="group-members">
          <h3>Members</h3>
          <div className="members-grid">
            {group.members?.map((m, i) => (
              <div key={i} className="member-card">
                <span className="avatar-placeholder">{m.userId?.name?.[0] || '?'}</span>
                <span>{m.userId?.name || 'User'}</span>
                <span className={`role-badge role-${m.role}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Groups List View
  return (
    <div className="groups-page">
      <div className="groups-header">
        <h1>Groups</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Group</button>
      </div>
      <div className="groups-grid">
        {groups.length === 0 ? (
          <div className="empty-text">No groups yet. Create one!</div>
        ) : groups.map(g => (
          <Link to={`/groups/${g._id}`} key={g._id} className="group-card">
            <div className="group-card-cover" style={g.coverImage ? { backgroundImage: `url(${g.coverImage})` } : {}}>
              <span className="group-card-icon">👥</span>
            </div>
            <div className="group-card-body">
              <h3>{g.name}</h3>
              <p>{g.description || 'No description'}</p>
              <div className="group-card-footer">
                <span>{g.memberCount || g.members?.length || 0} members</span>
                <span className={`category-badge cat-${g.category}`}>{g.category}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
              <button onClick={handleCreate} className="btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
