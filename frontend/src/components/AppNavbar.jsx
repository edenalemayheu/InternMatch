/**
 * AppNavbar — role-based navigation bar for authenticated pages.
 * Never shown on the landing page.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const STUDENT_LINKS = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/postings',   label: 'Browse' },
  { to: '/rank',       label: 'My Ranking' },
  { to: '/reveal',     label: 'Results' },
];

const COMPANY_LINKS = [
  { to: '/dashboard',          label: 'Dashboard' },
  { to: '/company/postings',   label: 'Postings' },
  { to: '/reveal',             label: 'Results' },
];

const ADMIN_LINKS = [
  { to: '/admin',    label: 'Admin Panel' },
];

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const links = user?.is_admin ? ADMIN_LINKS
    : user?.role === 'student' ? STUDENT_LINKS
    : user?.role === 'company' ? COMPANY_LINKS
    : [];

  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="app-navbar__inner">
        <NavLink to={user?.is_admin ? '/admin' : '/dashboard'} className="app-navbar__logo">
          InternMatch
        </NavLink>

        <div className="app-navbar__links">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `app-navbar__link ${isActive ? 'app-navbar__link--active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="app-navbar__right">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} />
            {user?.email}
          </span>
          <button className="app-navbar__user-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
