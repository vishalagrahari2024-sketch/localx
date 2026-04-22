import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from './ThemeProvider';
import api from '../utils/api';
import { Search, Home, MessageCircle, Users, Compass, Sun, Moon, Bell, LogOut, Shield, User as UserIcon, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications?limit=10');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {}
    };
    if (user) fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/search', label: 'Explore', icon: Compass },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/home" className="navbar-logo">
          <div className="logo-icon-bg">
            <GraduationCap className="logo-icon-svg" size={24} strokeWidth={2.5} />
          </div>
          <span className="logo-text">SmartX</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="navbar-search">
          <Search className="search-icon" size={18} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search communities, people, posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Nav Links */}
        <nav className="navbar-links">
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                title={link.label}
              >
                <Icon size={20} strokeWidth={isActive(link.path) ? 2.5 : 2} className="nav-icon-svg" />
                <span className="nav-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} className="icon-btn theme-toggle" title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          </button>

          {/* Notifications */}
          <div className="dropdown-wrapper" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`icon-btn notification-btn ${unreadCount > 0 ? 'has-notifications' : ''}`}
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="badge bounce-animation">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="dropdown-panel notifications-panel glass-panel">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-btn">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="empty-state-dropdown">
                      <Bell size={32} className="empty-icon-muted" />
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                      >
                        <div className="notif-avatar">
                          {notif.senderId?.avatar ? (
                            <img src={notif.senderId.avatar} alt="" />
                          ) : (
                            <span className="avatar-placeholder">
                              {notif.senderId?.name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div className="notif-content">
                          <p>{notif.message}</p>
                          <span className="notif-time">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {!notif.isRead && <div className="unread-dot"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="dropdown-wrapper" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="user-avatar-btn"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="user-avatar-img" />
              ) : (
                <span className="avatar-placeholder">
                  {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </span>
              )}
            </button>
            {showUserMenu && (
              <div className="dropdown-panel user-menu glass-panel">
                <div className="user-menu-header">
                  <p className="user-menu-name">{user?.displayName || 'User'}</p>
                  <p className="user-menu-email">{user?.email}</p>
                </div>
                <Link to="/profile" className="menu-item" onClick={() => setShowUserMenu(false)}>
                  <UserIcon size={16} /> <span>My Profile</span>
                </Link>
                <Link to="/admin" className="menu-item" onClick={() => setShowUserMenu(false)}>
                  <Shield size={16} /> <span>Admin Panel</span>
                </Link>
                <div className="menu-divider"></div>
                <button onClick={handleLogout} className="menu-item danger">
                  <LogOut size={16} /> <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
