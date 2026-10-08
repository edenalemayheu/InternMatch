/**
 * LandingNav — landing page navigation bar.
 * Matches v4 copy exactly:
 *   InternMatch | How it works | Algorithm | Timeline | Sign in | Sign up
 *
 * "Sign in" → /login
 * "Sign up" → opens a "Student or Company?" glass modal, then routes
 *             to /signup?role=student or /signup?role=company
 * No admin link anywhere.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import styles from './Landing.module.css';

export default function LandingNav() {
  const [roleModal, setRoleModal] = useState(false);
  const navigate = useNavigate();

  function choose(role) {
    setRoleModal(false);
    navigate(`/signup?role=${role}`);
  }

  return (
    <>
      <nav className={styles.nav} aria-label="Site navigation">
        <Link to="/" className={styles.navLogo} aria-label="InternMatch home">
          Intern<span>Match</span>
        </Link>

        <ul className={styles.navLinks} role="list">
          <li><a href="#how-it-works" className={styles.navLink}>How it works</a></li>
          <li><a href="#algorithm"    className={styles.navLink}>Algorithm</a></li>
          <li><a href="#timeline"     className={styles.navLink}>Timeline</a></li>
        </ul>

        <div className={styles.navActions}>
          <Link to="/login" className="btn btn--ghost btn--sm">Sign in</Link>
          <button
            type="button"
            onClick={() => setRoleModal(true)}
            className="btn btn--primary btn--sm"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Role picker — "Student or Company?" */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Join InternMatch" size="sm">
        <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)', lineHeight: 'var(--leading-normal)' }}>
          Are you a student looking for an internship, or a company looking for great talent?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            variant="primary" size="lg"
            onClick={() => choose('student')}
            style={{ justifyContent: 'center', width: '100%' }}
          >
            I'm a Student
          </Button>
          <Button
            variant="secondary" size="lg"
            onClick={() => choose('company')}
            style={{ justifyContent: 'center', width: '100%' }}
          >
            I'm a Company
          </Button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>
          Already have an account?{' '}
          <Link to="/login" onClick={() => setRoleModal(false)} style={{ color: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </p>
      </Modal>
    </>
  );
}
