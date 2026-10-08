import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-16)', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-4)' }}>404</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-8)' }}>
        This page doesn't exist.
      </p>
      <Link to="/" style={{ background: 'var(--color-primary-600)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
        Go to homepage
      </Link>
    </div>
  );
}
