/**
 * LandingNav: floating glass bar. Sign up opens a two-item menu so the role
 * is always chosen by entry point, never by a form field (pages.md).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function LandingNav({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="lp-nav">
      <div className="lp-nav__pill">
        <Link to="/" className="lp-logo" aria-label="InternMatch home">Intern<span>Match</span></Link>

        <nav className="lp-nav__links" aria-label="Page sections">
          <a href="#round">The round</a>
          <a href="#why">Why ranking</a>
          <a href="#score">The score</a>
        </nav>

        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__signin">Sign in</Link>

          <div className="lp-menu" ref={menuRef}>
            <button
              type="button"
              className="lp-btn lp-btn--solid lp-btn--sm"
              aria-expanded={open}
              aria-controls="lp-signup-menu"
              onClick={() => setOpen((o) => !o)}
            >
              Sign up
            </button>
            {open && (
              <div id="lp-signup-menu" className="lp-menu__panel">
                <Link to="/signup?role=student" onClick={() => setOpen(false)}>As a student</Link>
                <Link to="/signup?role=company" onClick={() => setOpen(false)}>As a company</Link>
                <Link to="/login" className="lp-menu__mobileOnly" onClick={() => setOpen(false)}>I already have an account</Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lp-iconbtn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
