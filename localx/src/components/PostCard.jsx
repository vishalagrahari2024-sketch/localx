import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, Trash2, AlertCircle, Send, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PostCard({ post, currentUserId, onLike, onComment, onBookmark, onShare, onDelete }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isLiked = post.likes?.includes(currentUserId);
  const isBookmarked = post.bookmarks?.includes(currentUserId);
  const isOwner = post.userId === currentUserId;

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment?.(post._id, commentText.trim());
      setCommentText('');
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <article className={`post-card glass-panel ${post.isAnnouncement ? 'announcement' : ''}`}>
      {post.isAnnouncement && (
        <div className="announcement-badge">
          <Pin size={14} className="badge-icon" /> Announcement
        </div>
      )}

      {/* Header */}
      <div className="post-header">
        <Link to={`/profile/${post.authorId}`} className="post-author" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="post-avatar">
            <span className="avatar-placeholder">
              {post.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="post-meta">
            <h4 className="post-author-name hover:underline">
              {isOwner ? 'You' : post.username || 'User'}
            </h4>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </Link>
        <div className="post-menu-wrapper">
          <button className="icon-btn-sm" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="dropdown-panel post-menu glass-panel">
              {isOwner && (
                <button onClick={() => { onDelete?.(post._id); setShowMenu(false); }} className="menu-item danger">
                  <Trash2 size={16} /> Delete Post
                </button>
              )}
              <button onClick={() => setShowMenu(false)} className="menu-item">
                <AlertCircle size={16} /> Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="post-body">
        {post.text && <p className="post-text">{post.text}</p>}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, i) => (
              <span key={i} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.mediaUrls?.length > 0 ? (
          <div className={`post-media-grid grid-${Math.min(post.mediaUrls.length, 4)}`}>
            {post.mediaUrls.slice(0, 4).map((url, i) => (
              <img key={i} src={url} alt="" className="post-media-img" loading="lazy" />
            ))}
          </div>
        ) : post.mediaUrl ? (
          <div className="post-media">
            {post.mediaType === 'video' || post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video controls className="post-media-video" src={post.mediaUrl} />
            ) : (
              <img src={post.mediaUrl} alt="" className="post-media-img" loading="lazy" />
            )}
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div className="post-stats">
        <span className="stat-item">{post.likes?.length || 0} likes</span>
        <span className="stat-dot">•</span>
        <span className="stat-item">{post.comments?.length || 0} comments</span>
        {post.shares?.length > 0 && (
          <>
            <span className="stat-dot">•</span>
            <span className="stat-item">{post.shares.length} shares</span>
          </>
        )}
      </div>

      <div className="post-divider" />

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onLike?.(post._id)}
        >
          <Heart size={20} className={isLiked ? 'fill-current text-red-500' : ''} />
          <span>Like</span>
        </button>
        <button className={`action-btn ${showComments ? 'active' : ''}`} onClick={() => setShowComments(!showComments)}>
          <MessageSquare size={20} />
          <span>Comment</span>
        </button>
        <button className="action-btn" onClick={() => onShare?.(post._id)}>
          <Share2 size={20} />
          <span>Share</span>
        </button>
        <button
          className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={() => onBookmark?.(post._id)}
        >
          <Bookmark size={20} className={isBookmarked ? 'fill-current text-blue-500' : ''} />
          <span>Save</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="post-comments">
          <div className="comment-input-wrapper glass-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
              className="comment-input"
            />
            <button onClick={handleCommentSubmit} className="comment-send-btn icon-btn-sm" disabled={!commentText.trim()}>
              <Send size={18} />
            </button>
          </div>
          <div className="comments-list">
            {post.comments?.map((comment, idx) => (
              <div key={idx} className="comment-item">
                <div className="comment-avatar-sm">
                  {comment.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="comment-bubble">
                  <span className="comment-author">{comment.username || 'User'}</span>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
