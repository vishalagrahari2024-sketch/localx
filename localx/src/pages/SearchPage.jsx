import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q) => {
    if (!q?.trim()) return;
    setLoading(true);
    setSearchParams({ q: q.trim() });
    try {
      const [uRes, pRes, gRes] = await Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(q)}`),
        api.get(`/posts?search=${encodeURIComponent(q)}&limit=30`),
        api.get(`/groups?search=${encodeURIComponent(q)}`),
      ]);
      setUsers(uRes.data || []);
      setPosts(pRes.data.posts || []);
      setGroups(gRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
  }, []);

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1>Explore LocalX</h1>
        <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="search-form-lg">
          <input type="text" placeholder="Search users, posts, groups..." value={query}
            onChange={(e) => setQuery(e.target.value)} className="search-input-lg" autoFocus />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>
      <div className="search-tabs">
        {[{ id: 'users', label: `Users (${users.length})` }, { id: 'posts', label: `Posts (${posts.length})` },
          { id: 'groups', label: `Groups (${groups.length})` }].map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>
      {loading && <div className="feed-loading"><div className="spinner"></div></div>}
      <div className="search-results">
        {activeTab === 'users' && (
          <div className="user-results">
            {users.length === 0 ? <div className="empty-text">No users found</div> : users.map(u => (
              <Link to={`/profile/${u._id}`} key={u._id} className="user-result-card">
                <span className="avatar-placeholder">{u.name?.[0]}</span>
                <div><h4>{u.name}</h4><p>{u.department || u.email}</p></div>
                <span className={`role-badge role-${u.role}`}>{u.role}</span>
              </Link>
            ))}
          </div>
        )}
        {activeTab === 'posts' && (
          <div className="post-results">
            {posts.length === 0 ? <div className="empty-text">No posts found</div> :
              posts.map(p => <PostCard key={p._id} post={p} />)}
          </div>
        )}
        {activeTab === 'groups' && (
          <div className="group-results">
            {groups.length === 0 ? <div className="empty-text">No groups found</div> : groups.map(g => (
              <Link to={`/groups/${g._id}`} key={g._id} className="group-result-card">
                <span>👥</span><div><h4>{g.name}</h4><p>{g.description || 'No description'}</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
