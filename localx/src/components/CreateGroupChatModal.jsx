import React, { useState } from 'react';
import api from '../utils/api';

export default function CreateGroupChatModal({ onClose, onSuccess, connections }) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Deduplicate connections (followers + following)
  const allConnections = connections || [];
  const uniqueConnections = [];
  const seen = new Set();
  for (const user of allConnections) {
    if (user && user._id && !seen.has(user._id)) {
      seen.add(user._id);
      uniqueConnections.push(user);
    }
  }

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/messages/conversations/group', {
        name: groupName.trim(),
        participantIds: selectedUsers,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-color)] hover:bg-[var(--border-color)]"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Create Group Chat</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Group Name</label>
          <input
            type="text"
            className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)] transition-colors"
            placeholder="E.g., Study Buddies"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Select Participants</label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-2 custom-scrollbar">
            {uniqueConnections.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center p-4 text-sm">No connections available</p>
            ) : (
              uniqueConnections.map(user => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer transition-colors"
                  onClick={() => toggleUser(user._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUser(user._id)}
                    className="w-4 h-4 rounded text-[var(--primary-color)] bg-[var(--bg-secondary)] border-[var(--border-color)] focus:ring-[var(--primary-color)] focus:ring-offset-[var(--bg-color)]"
                  />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{user.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <span className="text-[var(--text-primary)] text-sm font-medium truncate">{user.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-color)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || selectedUsers.length === 0 || !groupName.trim()}
            className="px-5 py-2.5 rounded-xl font-medium bg-[var(--primary-color)] text-white hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary-color)]/20"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
