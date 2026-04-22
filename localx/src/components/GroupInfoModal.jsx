import React from 'react';

export default function GroupInfoModal({ group, onClose }) {
  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/80 transition-colors w-8 h-8 flex items-center justify-center rounded-full"
        >
          ✕
        </button>
        
        <div className="h-40 bg-gradient-to-r from-sky-400 to-indigo-500 relative flex items-center justify-center text-5xl" style={group.coverImage ? { backgroundImage: `url(${group.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          {!group.coverImage && <span className="group-card-icon drop-shadow-md">👥</span>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <h2 className="absolute bottom-4 left-6 text-2xl font-bold text-white drop-shadow-lg">{group.name}</h2>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-xs font-medium capitalize bg-[var(--bg-color)] text-[var(--primary-color)] border border-[var(--border-color)]`}>{group.category}</span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--bg-color)] text-[var(--text-secondary)] border border-[var(--border-color)]">{group.memberCount || group.members?.length} Members</span>
          </div>
          
          <p className="text-[var(--text-secondary)] text-sm mb-6 pb-6 border-b border-[var(--border-color)]">
            {group.description || 'No description provided.'}
          </p>

          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>Members</span>
              <span className="bg-[var(--bg-color)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded-full">{group.members?.length}</span>
            </h3>
            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              {group.members?.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center overflow-hidden shrink-0">
                    {m.userId?.avatar ? (
                      <img src={m.userId.avatar} alt={m.userId.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">{m.userId?.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{m.userId?.name || 'User'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${m.role === 'owner' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-[var(--bg-color)] text-[var(--text-secondary)]'}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
