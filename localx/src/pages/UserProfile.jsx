import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../components/firebase';
import PostCard from '../components/PostCard';
import api from '../utils/api';

export default function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const currentUser = auth.currentUser;
  const isOwnProfile = !userId || userId === 'me';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile ? '/users/me' : `/users/${userId}`;
        const res = await api.get(endpoint);
        setProfile(res.data);

        // Check if following
        if (!isOwnProfile && res.data.followers && currentUser) {
          try {
            const myProfile = await api.get('/users/me');
            setIsFollowing(
              res.data.followers.some(f => f._id === myProfile.data._id)
            );
            setIsFollower(
              res.data.following?.some(f => f._id === myProfile.data._id) || false
            );
          } catch (meErr) {
            console.error('Could not fetch current user for follow status:', meErr.response?.data || meErr);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    // Fetch user's posts
    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts', {
          params: { limit: 50 },
        });
        const userPosts = isOwnProfile
          ? (res.data.posts || []).filter(p => p.userId === currentUser?.uid)
          : (res.data.posts || []).filter(p => p.authorId === userId);
        setPosts(userPosts);
      } catch (err) { /* ignore */ }
    };
    if (currentUser) fetchPosts();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile._id}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${profile._id}/follow`);
        setIsFollowing(true);
      }
      
      // Refetch profile to get accurate follower count and list
      const endpoint = isOwnProfile ? '/users/me' : `/users/${userId}`;
      const res = await api.get(endpoint);
      setProfile(res.data);
      
    } catch (err) { console.error(err); }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/users/me', editData);
      setProfile(res.data.user);
      setEditMode(false);
    } catch (err) { console.error(err); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (postId, text) => {
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (!profile) {
    return (
      <div className="main-content">
        <div className="glass-panel p-8 text-center flex flex-col items-center justify-center rounded-2xl text-[var(--text-secondary)] mt-8">
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  const mediaPosts = posts.filter(p => p.mediaUrl || p.mediaUrls?.length > 0);

  return (
    <div className="main-content">
      <div className="max-w-4xl mx-auto pb-12">
        {/* Cover & Header */}
        <div className="glass-panel overflow-hidden mb-8">
          <div 
            className="h-48 md:h-64 w-full bg-gradient-to-r from-sky-400 to-indigo-500 relative"
            style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          ></div>
          
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--bg-secondary)] bg-[var(--bg-color)] overflow-hidden shadow-lg z-10 flex shrink-0">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] text-white text-4xl font-bold">
                    {profile.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 z-10">
                {isOwnProfile ? (
                  <button className="btn-secondary" onClick={() => { 
                    setEditMode(true); 
                    setEditData({ name: profile.name, bio: profile.bio || '', department: profile.department || '', year: profile.year || '' }); 
                  }}>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                      onClick={handleFollow}
                    >
                      {isFollowing ? 'Following' : isFollower ? 'Follow Back' : 'Follow'}
                    </button>
                    <button className="btn-secondary">Message</button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{profile.name}</h1>
              <p className="text-[var(--text-secondary)] font-medium mb-3">
                {profile.department && `${profile.department}`}
                {profile.year && ` • ${profile.year}`}
                {profile.role && profile.role !== 'student' && (
                  <span className="ml-2 px-2 py-0.5 bg-[var(--warning-bg)] text-[var(--warning-color)] rounded-full text-xs font-bold uppercase tracking-wide">
                    {profile.role}
                  </span>
                )}
              </p>
              {profile.bio && <p className="text-[var(--text-primary)] max-w-2xl mb-4 leading-relaxed">{profile.bio}</p>}
              
              <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[var(--border-color)]">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{posts.length}</span>
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Posts</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{profile.followers?.length || 0}</span>
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{profile.following?.length || 0}</span>
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-[var(--border-color)]">
          {['posts', 'media', 'about'].map(tab => (
            <button
              key={tab}
              className={`px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'posts' && (
            <div className="flex flex-col gap-6">
              {posts.length === 0 ? (
                <div className="glass-panel p-12 text-center text-[var(--text-secondary)]">
                  <p className="text-lg">No posts yet</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUser?.uid}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaPosts.length === 0 ? (
                <div className="col-span-full glass-panel p-12 text-center text-[var(--text-secondary)]">
                  <p className="text-lg">No media posts yet</p>
                </div>
              ) : (
                mediaPosts.map(post => (
                  <div key={post._id} className="aspect-square rounded-xl overflow-hidden glass-panel border border-[var(--border-color)] hover:opacity-90 transition-opacity cursor-pointer">
                    <img src={post.mediaUrl || post.mediaUrls?.[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="glass-panel p-8">
              <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">About</h3>
              <div className="grid gap-4 max-w-md">
                <div className="flex justify-between py-3 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)]">Email</span>
                  <span className="font-medium text-[var(--text-primary)]">{profile.email}</span>
                </div>
                {profile.department && (
                  <div className="flex justify-between py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Department</span>
                    <span className="font-medium text-[var(--text-primary)]">{profile.department}</span>
                  </div>
                )}
                {profile.year && (
                  <div className="flex justify-between py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Year</span>
                    <span className="font-medium text-[var(--text-primary)]">{profile.year}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)]">Joined</span>
                  <span className="font-medium text-[var(--text-primary)]">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {editMode && (
          <div className="modal-overlay" onClick={() => setEditMode(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Profile</h2>
                <button onClick={() => setEditMode(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={editData.name || ''} onChange={e => setEditData(p => ({...p, name: e.target.value}))} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea value={editData.bio || ''} onChange={e => setEditData(p => ({...p, bio: e.target.value}))} className="form-input" maxLength={160} rows={3} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={editData.department || ''} onChange={e => setEditData(p => ({...p, department: e.target.value}))} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="text" value={editData.year || ''} onChange={e => setEditData(p => ({...p, year: e.target.value}))} className="form-input" placeholder="e.g. 2nd Year" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveProfile} className="btn-primary">Save Profile</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
