/**
 * Navbar — glass top bar.
 * Adapts nav links based on role.
 * All emoji replaced with inline SVG icons.
 */
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRound } from '@/context/RoundContext';
import PhaseBadge from './PhaseBadge';
import Stepper from './Stepper';
import Avatar from './Avatar';
import * as api from '@/data/api';

/* ── Minimal inline SVG icons (no emoji) ─────────────────────────────────── */
function IconSun() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function IconMoon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function IconUser() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconLogOut() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

/* ── Active nav link style ────────────────────────────────────────────────── */
const navLinkStyle = ({ isActive }) => ({
  fontSize: 'var(--text-sm)',
  fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
  color: isActive ? 'var(--color-primary)' : 'var(--color-ink-2)',
  textDecoration: 'none',
  padding: 'var(--space-2) var(--space-1)',
  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
  transition: 'color var(--transition-fast), border-color var(--transition-fast)',
  whiteSpace: 'nowrap',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
});

function StudentNav() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  React.useEffect(() => {
    api.getNotifications().then(r => {
      setUnreadCount(r.notifications.filter(n => !n.read).length);
    }).catch(() => {});
  }, []);

  return (
    <>
      <NavLink to="/student"                end style={navLinkStyle}>Dashboard</NavLink>
      <NavLink to="/student/postings"           style={navLinkStyle}>Browse</NavLink>
      <NavLink to="/student/ranking"            style={navLinkStyle}>My Ranking</NavLink>
      <NavLink to="/student/notifications"      style={navLinkStyle}>
        Notifications
        {unreadCount > 0 && (
          <span style={{ marginLeft:'var(--space-1)',background:'var(--color-primary)',color:'white',fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'var(--radius-full)',minWidth:'18px',textAlign:'center' }} aria-label={`${unreadCount} unread`}>
            {unreadCount}
          </span>
        )}
      </NavLink>
      <NavLink to="/student/profile"            style={navLinkStyle}>Profile</NavLink>
      <NavLink to="/student/result"             style={navLinkStyle}>Result</NavLink>
    </>
  );
}

function CompanyNav() {
  return (
    <>
      <NavLink to="/company"              end style={navLinkStyle}>Dashboard</NavLink>
      <NavLink to="/company/postings"         style={navLinkStyle}>Postings</NavLink>
      <NavLink to="/company/applicants"       style={navLinkStyle}>Applicants</NavLink>
      <NavLink to="/company/shortlist"        style={navLinkStyle}>Shortlist</NavLink>
      <NavLink to="/company/final-ranking"    style={navLinkStyle}>Final Ranking</NavLink>
      <NavLink to="/company/result"           style={navLinkStyle}>Result</NavLink>
    </>
  );
}

function AdminNav() {
  return (
    <>
      <NavLink to="/admin"         end style={navLinkStyle}>Control Panel</NavLink>
      <NavLink to="/admin/data"        style={navLinkStyle}>Data</NavLink>
      <NavLink to="/admin/results"     style={navLinkStyle}>Results</NavLink>
    </>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }
  return (
    <button type="button" onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="btn btn--ghost btn--icon">
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const h = e => { if (!menuRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const profileHref = user.role === 'student' ? '/student/profile'
                    : user.role === 'company'  ? '/company/profile'
                    : null;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        aria-haspopup="true" aria-expanded={open} aria-label="User menu"
        style={{ display:'flex',alignItems:'center',gap:'var(--space-2)',background:'none',border:'none',cursor:'pointer',padding:'var(--space-1)',borderRadius:'var(--radius-full)',minHeight:'44px' }}>
        <Avatar name={user.name ?? user.email} size="sm" />
        <span style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-2)',fontWeight:500,maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
          {user.name ?? user.email}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 6" fill="currentColor" style={{ color:'var(--color-ink-3)', marginTop:1 }} aria-hidden="true"><path d="M0 0l5 6 5-6H0z"/></svg>
      </button>

      {open && (
        <div style={{ position:'absolute',right:0,top:'calc(100% + 8px)',background:'var(--glass-bg-opaque)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-lg)',minWidth:'180px',zIndex:'var(--z-above)',overflow:'hidden',animation:'modal-in var(--transition-fast) both' }}>
          {profileHref && (
            <Link to={profileHref} onClick={() => setOpen(false)}
              style={{ display:'flex',alignItems:'center',gap:'var(--space-2)',padding:'var(--space-3) var(--space-4)',fontSize:'var(--text-sm)',color:'var(--color-ink)',textDecoration:'none' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--color-primary-light)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <IconUser /> Profile
            </Link>
          )}
          <div style={{ height:'1px',background:'var(--color-border-subtle)',margin:'0 var(--space-2)' }} />
          <button type="button" onClick={() => { setOpen(false); onLogout(); }}
            style={{ display:'flex',alignItems:'center',gap:'var(--space-2)',width:'100%',textAlign:'left',padding:'var(--space-3) var(--space-4)',fontSize:'var(--text-sm)',color:'var(--color-danger)',background:'none',border:'none',cursor:'pointer',minHeight:'44px' }}>
            <IconLogOut /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { phase } = useRound();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isLanding = location.pathname === '/';

  async function handleLogout() { await logout(); navigate('/'); }

  const dashboardHref = currentUser?.is_admin ? '/admin'
                      : currentUser?.role === 'company' ? '/company'
                      : '/student';

  return (
    <header role="banner" style={{ position:'sticky',top:0,zIndex:'var(--z-navbar)',background:'var(--glass-bg)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',borderBottom:'1px solid var(--glass-border)' }}>
      <div style={{ maxWidth:'1200px',margin:'0 auto',padding:'0 var(--space-6)',height:'64px',display:'flex',alignItems:'center',gap:'var(--space-4)' }}>
        {/* Logo */}
        <Link to={currentUser ? dashboardHref : '/'} style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'var(--text-xl)',color:'var(--color-ink)',textDecoration:'none',letterSpacing:'-0.02em',whiteSpace:'nowrap',flexShrink:0 }}>
          Intern<span style={{ color:'var(--color-primary)' }}>Match</span>
        </Link>

        {/* Role-based nav links */}
        {!isLanding && currentUser && (
          <nav style={{ display:'flex',alignItems:'center',gap:'var(--space-4)',flex:1,overflow:'hidden' }} aria-label="Main navigation">
            <div style={{ display:'flex',gap:'var(--space-4)',overflow:'hidden' }}>
              {currentUser.is_admin   && <AdminNav />}
              {!currentUser.is_admin && currentUser.role === 'student'  && <StudentNav />}
              {!currentUser.is_admin && currentUser.role === 'company'  && <CompanyNav />}
            </div>
            {phase && (
              <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:'var(--space-3)',flexShrink:0 }}>
                <Stepper currentPhase={phase} compact />
                <PhaseBadge phase={phase} size="sm" />
              </div>
            )}
          </nav>
        )}

        {(!currentUser || isLanding) && <div style={{ flex:1 }} />}

        {/* Right side */}
        <div style={{ display:'flex',alignItems:'center',gap:'var(--space-2)',flexShrink:0 }}>
          <ThemeToggle />
          {currentUser ? (
            <UserMenu user={currentUser} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/login"               className="btn btn--ghost btn--sm">Sign in</Link>
              <Link to="/signup?role=student" className="btn btn--primary btn--sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
