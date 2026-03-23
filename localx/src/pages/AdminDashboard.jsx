import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, usersRes, reportsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/users?limit=50'),
          api.get('/admin/reports'),
        ]);
        setAnalytics(analyticsRes.data);
        setUsers(usersRes.data.users || []);
        setReports(reportsRes.data.reports || []);
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) { console.error(err); }
  };

  const handleSuspend = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user and all their posts?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) { console.error(err); }
  };

  const handleReportAction = async (reportId, status) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return <div className="feed-loading"><div className="spinner"></div><p>Loading admin panel...</p></div>;
  }

  const sections = [
    { id: 'analytics', label: '📊 Analytics', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'reports', label: '🚩 Reports', icon: '🚩' },
    { id: 'announcements', label: '📌 Announcements', icon: '📌' },
  ];

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-title">🛡️ Admin</h2>
        <nav className="admin-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`admin-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Analytics */}
        {activeSection === 'analytics' && analytics && (
          <div className="admin-section">
            <h2>Dashboard Analytics</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">👥</div>
                <div className="stat-card-value">{analytics.totalUsers}</div>
                <div className="stat-card-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">📝</div>
                <div className="stat-card-value">{analytics.totalPosts}</div>
                <div className="stat-card-label">Total Posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🆕</div>
                <div className="stat-card-value">{analytics.todayUsers}</div>
                <div className="stat-card-label">New Users Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">📈</div>
                <div className="stat-card-value">{analytics.todayPosts}</div>
                <div className="stat-card-label">Posts Today</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-card-icon">🚩</div>
                <div className="stat-card-value">{analytics.totalReports}</div>
                <div className="stat-card-label">Pending Reports</div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Posts Per Day (Last 7 Days)</h3>
                <div className="bar-chart">
                  {analytics.postsPerDay?.map((d, i) => (
                    <div key={i} className="bar-item">
                      <div className="bar" style={{ height: `${Math.max((d.count / Math.max(...analytics.postsPerDay.map(x=>x.count), 1)) * 100, 5)}%` }}>
                        <span className="bar-value">{d.count}</span>
                      </div>
                      <span className="bar-label">{d._id.split('-').slice(1).join('/')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Top Departments</h3>
                <div className="dept-list">
                  {analytics.topDepartments?.map((d, i) => (
                    <div key={i} className="dept-item">
                      <span className="dept-name">{d._id}</span>
                      <div className="dept-bar">
                        <div className="dept-fill" style={{ width: `${(d.count / Math.max(...analytics.topDepartments.map(x=>x.count), 1)) * 100}%` }}></div>
                      </div>
                      <span className="dept-count">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Role Distribution</h3>
                <div className="role-pills">
                  {analytics.roleDistribution?.map((r, i) => (
                    <div key={i} className={`role-pill role-${r._id}`}>
                      <span className="role-name">{r._id}</span>
                      <span className="role-count">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeSection === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <div className="admin-filters">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="form-input"
              />
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-select">
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className={user.isSuspended ? 'suspended' : ''}>
                      <td>
                        <div className="user-cell">
                          <span className="avatar-placeholder-sm">{user.name?.[0]}</span>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.department || '—'}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isSuspended ? 'suspended' : 'active'}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button onClick={() => handleSuspend(user._id)} className="btn-sm btn-warning">
                            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button onClick={() => handleDeleteUser(user._id)} className="btn-sm btn-danger">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeSection === 'reports' && (
          <div className="admin-section">
            <h2>Content Reports</h2>
            {reports.length === 0 ? (
              <div className="empty-text">No pending reports 🎉</div>
            ) : (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report._id} className={`report-card status-${report.status}`}>
                    <div className="report-header">
                      <span className="report-type">{report.contentType}</span>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <p className="report-reason"><strong>Reason:</strong> {report.reason}</p>
                    <p className="report-reporter">
                      <strong>Reported by:</strong> {report.reporterId?.name || 'Unknown'}
                    </p>
                    <p className="report-time">{new Date(report.createdAt).toLocaleDateString()}</p>
                    {report.status === 'pending' && (
                      <div className="report-actions">
                        <button onClick={() => handleReportAction(report._id, 'resolved')} className="btn-sm btn-primary">
                          Resolve
                        </button>
                        <button onClick={() => handleReportAction(report._id, 'dismissed')} className="btn-sm btn-secondary">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements */}
        {activeSection === 'announcements' && (
          <div className="admin-section">
            <h2>Manage Announcements</h2>
            <p className="section-desc">Pinned faculty announcements appear at the top of every user's feed.</p>
            <div className="empty-text">Pin announcements from the post moderation view or the main feed.</div>
          </div>
        )}
      </main>
    </div>
  );
}
