import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../components/firebase';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import api from '../utils/api';
import { connectSocket } from '../utils/socket';
import { TrendingUp, Users as UsersIcon, Megaphone, Inbox, Home, Compass, User as UserIcon } from 'lucide-react';

export default function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [dbUser, setDbUser] = useState(null);

  const user = auth.currentUser;

  // Fetch user info for role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setDbUser(res.data);
        setUserRole(res.data.role || 'student');
      } catch (err) {}
    };
    if (user) fetchUser();
  }, [user]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/posts/announcements');
        setAnnouncements(res.data || []);
      } catch (err) {}
    };
    if (user) fetchAnnouncements();
  }, [user]);

  // Fetch feed
  const fetchPosts = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      const params = { limit: 20 };
      if (loadMore && cursor) params.cursor = cursor;

      const res = await api.get('/posts', { params });

      if (loadMore) {
        setPosts(prev => [...prev, ...(res.data.posts || [])]);
      } else {
        setPosts(res.data.posts || []);
      }

      setCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  // Socket.IO real-time updates
  useEffect(() => {
    const setupSocket = async () => {
      const socket = await connectSocket();
      if (!socket) return;

      socket.on('new-post', (post) => {
        setPosts(prev => [post, ...prev]);
        if (post.isAnnouncement) {
          setAnnouncements(prev => [post, ...prev]);
        }
      });

      socket.on('like-update', ({ postId, likesCount, likes }) => {
        setPosts(prev => prev.map(p =>
          p._id === postId ? { ...p, likesCount, likes } : p
        ));
      });

      socket.on('comment-update', ({ postId, commentsCount, comment }) => {
        setPosts(prev => prev.map(p =>
          p._id === postId
            ? { ...p, commentsCount, comments: [...(p.comments || []), comment] }
            : p
        ));
      });
    };

    setupSocket();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        hasMore && !loadingMore
      ) {
        fetchPosts(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, cursor]);

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

  const handleBookmark = async (postId) => {
    try {
      await api.post(`/posts/${postId}/bookmark`);
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        const isBookmarked = p.bookmarks?.includes(user.uid);
        return {
          ...p,
          bookmarks: isBookmarked
            ? p.bookmarks.filter(id => id !== user.uid)
            : [...(p.bookmarks || []), user.uid],
        };
      }));
    } catch (err) { console.error(err); }
  };

  const handleShare = async (postId) => {
    try {
      await api.post(`/posts/${postId}/share`);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.error(err); }
  };

  const handlePostCreated = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="main-content">
      <div className="feed-layout">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          {dbUser && (
            <div className="widget glass-panel p-0 overflow-hidden">
              <div 
                className="h-24 w-full bg-gradient-to-r from-sky-400 to-indigo-500"
                style={dbUser.coverPhoto ? { backgroundImage: `url(${dbUser.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              ></div>
              <div className="px-4 pb-5 relative text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-[var(--bg-secondary)] bg-[var(--bg-color)] overflow-hidden shadow-sm -mt-8 mb-3 flex items-center justify-center shrink-0">
                  {dbUser.avatar ? (
                    <img src={dbUser.avatar} alt={dbUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] text-white text-xl font-bold">
                      {dbUser.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg leading-tight mb-1">{dbUser.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4 font-medium">
                  {dbUser.department ? `${dbUser.department} ${dbUser.year ? `• ${dbUser.year}` : ''}` : dbUser.email}
                </p>
                <div className="flex justify-center gap-6 text-sm border-t border-[var(--border-color)] pt-4 text-[var(--text-primary)]">
                  <div className="text-center">
                    <div className="font-bold text-base">{dbUser.followersCount || 0}</div>
                    <div className="text-[var(--text-secondary)] text-xs font-medium">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">{dbUser.followingCount || 0}</div>
                    <div className="text-[var(--text-secondary)] text-xs font-medium">Following</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="widget glass-panel p-3">
            <nav className="flex flex-col gap-1">
              <Link to="/home" className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-color)] text-[var(--primary-color)] font-semibold transition-colors">
                <Home size={20} /> Home
              </Link>
              <Link to="/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-colors font-medium">
                <Compass size={20} /> Explore
              </Link>
              <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-colors font-medium">
                <Inbox size={20} /> Messages
              </Link>
              <Link to="/groups" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-colors font-medium">
                <UsersIcon size={20} /> Groups
              </Link>
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-colors font-medium border-t border-[var(--border-color)] mt-2 pt-3">
                <UserIcon size={20} /> My Profile
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Feed Column */}
        <main className="feed-column">
          {/* Create Post Bar */}
          <div className="create-post-bar glass-panel" onClick={() => setShowCreateModal(true)}>
            <div className="post-avatar">
              <span className="avatar-placeholder">
                {user?.displayName?.[0] || '?'}
              </span>
            </div>
            <div className="fake-input">What's on your mind?</div>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Post</button>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="mb-8">
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-[var(--text-primary)]">
                <Megaphone className="text-yellow-500" size={20} /> Announcements
              </h3>
              {announcements.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?.uid}
                  onLike={handleLike}
                  onComment={handleComment}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}

          {/* Normal Feed */}
          <div>
            {posts.length === 0 ? (
              <div className="glass-panel p-8 text-center flex flex-col items-center justify-center rounded-2xl text-[var(--text-secondary)]">
                <Inbox size={48} className="text-gray-400 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No posts yet</h3>
                <p>Be the first to share something with your community!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?.uid}
                  onLike={handleLike}
                  onComment={handleComment}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  onDelete={handleDelete}
                />
              ))
            )}

            {loadingMore && <div className="loading-spinner" style={{ width: 24, height: 24 }}></div>}

            {!hasMore && posts.length > 0 && (
              <div className="text-center p-8 text-[var(--text-secondary)] text-sm font-medium">
                You've reached the end! 🎉
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="widget glass-panel">
            <h3 className="widget-title">
              <TrendingUp size={18} className="text-[var(--primary-color)]" /> Trending Tags
            </h3>
            <div className="trending-tags">
              {['cse', 'hackathon', 'sports', 'fest2026', 'placement'].map(tag => (
                <span key={tag} className="tag clickable">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="widget glass-panel">
            <h3 className="widget-title">
              <UsersIcon size={18} className="text-[var(--secondary-color)]" /> Suggested Groups
            </h3>
            <div className="flex flex-col gap-3 mt-4">
              {['Coding Club', 'Music Society', 'Debate Forum'].map(name => (
                <div key={name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-color)] cursor-pointer transition-colors duration-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <UsersIcon size={18} />
                  </div>
                  <span className="font-semibold text-sm text-[var(--text-primary)]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onPostCreated={handlePostCreated}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
}
