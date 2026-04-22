import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Edit3, Users, MessageCircle, Pin, Bell, Moon as MoonIcon, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Hero */}
      <header className="landing-header">
        <nav className="landing-nav glass-panel">
          <div className="landing-logo">
            <div className="logo-icon-bg">
              <GraduationCap className="logo-icon-svg" size={24} strokeWidth={2.5} />
            </div>
            <span className="logo-text">SmartX</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/" className="btn-secondary">Log In</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Your College.<br />
              <span className="gradient-text">Your Community.</span>
            </h1>
            <p className="hero-subtitle">
              Connect with classmates, join clubs, share moments, and stay updated
              with everything happening on campus — all in one beautifully designed place.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn-primary hero-btn">
                Get Started <ArrowRight size={20} />
              </Link>
              <Link to="/" className="btn-secondary hero-btn">
                Log In
              </Link>
            </div>
            
            <div className="hero-stats glass-panel">
              <div className="stat">
                <span className="stat-number">Campus</span>
                <span className="stat-label">Network</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Secure</span>
              </div>
              <div className="stat">
                <span className="stat-number">Real-time</span>
                <span className="stat-label">Updates</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-mockup glass-panel">
              <div className="mockup-header">
                <div className="mockup-dot r"></div>
                <div className="mockup-dot y"></div>
                <div className="mockup-dot g"></div>
              </div>
              <div className="mockup-body">
                <div className="mockup-post">
                  <div className="mockup-avatar"></div>
                  <div className="mockup-lines">
                    <div className="m-line w-40"></div>
                    <div className="m-line w-80"></div>
                  </div>
                </div>
                <div className="mockup-post announcement">
                  <div className="mockup-badge"><Pin size={12}/> Announcement</div>
                  <div className="m-line w-full"></div>
                  <div className="m-line w-60"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">Everything You Need</h2>
        <div className="features-grid">
          {[
            { icon: Edit3, title: 'Share & Post', desc: 'Post updates, photos, and videos. Express yourself with rich media.' },
            { icon: Users, title: 'Groups & Clubs', desc: 'Join departments, clubs, and study groups. Collaborate with peers.' },
            { icon: MessageCircle, title: 'Real-time Chat', desc: 'Direct messages with read receipts and typing indicators.' },
            { icon: Pin, title: 'Announcements', desc: 'Faculty pins important announcements that stay on top of your feed.' },
            { icon: Bell, title: 'Notifications', desc: 'Stay updated with likes, comments, follows, and mentions.' },
            { icon: MoonIcon, title: 'Dark Mode', desc: 'Beautiful dark mode that is easy on the eyes during late-night study sessions.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="feature-card glass-panel">
                <div className="feature-icon-wrapper">
                  <Icon size={24} className="feature-icon" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer glass-panel">
        <div className="footer-content">
          <div className="footer-logo">
            <GraduationCap size={24} className="text-[var(--primary-color)]" />
            <span className="logo-text">SmartX</span>
          </div>
          <p>© 2026 SmartX — Built for your campus community</p>
        </div>
      </footer>
    </div>
  );
}
