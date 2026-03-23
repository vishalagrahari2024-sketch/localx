import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { X, Image as ImageIcon, Globe, Users, Building, Pin } from 'lucide-react';

export default function CreatePostModal({ onClose, onPostCreated, userRole }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const canAnnounce = userRole === 'faculty' || userRole === 'admin';

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
    const urls = selected.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) return;

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('visibility', visibility);
      formData.append('isAnnouncement', isAnnouncement.toString());
      if (tags.trim()) {
        formData.append('tags', tags.trim());
      }
      files.forEach(f => formData.append('media', f));

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onPostCreated?.(res.data.post);
      onClose?.();
    } catch (err) {
      console.error('Error creating post:', err.response?.data || err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-post-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Post</h2>
          <button onClick={onClose} className="icon-btn-sm close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <textarea
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="post-textarea"
            rows={4}
            autoFocus
          />

          {/* Media Previews */}
          {previews.length > 0 && (
            <div className="media-preview-grid">
              {previews.map((url, i) => (
                <div key={i} className="media-preview-item">
                  {files[i]?.type?.startsWith('video') ? (
                    <video src={url} className="preview-media" />
                  ) : (
                    <img src={url} alt="" className="preview-media" />
                  )}
                  <button onClick={() => removeFile(i)} className="remove-preview">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <input
            type="text"
            placeholder="Tags (comma separated): #club, #event, #cse"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="tags-input glass-input"
          />

          {/* Options Row */}
          <div className="post-options">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="option-btn"
              disabled={files.length >= 4}
            >
              <ImageIcon size={18} /> Media {files.length > 0 && `(${files.length}/4)`}
            </button>

            <div className="visibility-select-wrapper relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="visibility-select pl-8"
              >
                <option value="public">Public</option>
                <option value="department">Department</option>
                <option value="group">Group Only</option>
              </select>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                {visibility === 'public' && <Globe size={16} />}
                {visibility === 'department' && <Building size={16} />}
                {visibility === 'group' && <Users size={16} />}
              </div>
            </div>

            {canAnnounce && (
              <label className="announcement-toggle flex items-center gap-2 cursor-pointer p-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  className="accent-[var(--primary-color)] w-4 h-4 ml-2"
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                />
                <Pin size={16} className={isAnnouncement ? "text-yellow-500" : "text-gray-500"} />
                <span className="text-sm font-medium mr-3">Announcement</span>
              </label>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={posting || (!text.trim() && files.length === 0)}
            className="btn-primary"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
