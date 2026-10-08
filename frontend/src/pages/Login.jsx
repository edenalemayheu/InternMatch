/**
 * Login — /login
 * Email + password, demo accounts box (VITE_USE_MOCK only),
 * routes by role after login per spec.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Card    from '../components/ui/Card.jsx';
import Button  from '../components/ui/Button.jsx';
import Input   from '../components/ui/Input.jsx';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const DEMO_ACCOUNTS = [
  { label: 'Admin',       email: 'admin@internmatch.demo',    password: 'Admin123!',   role: 'Admin' },
  { label: 'Student A',   email: 'student1@internmatch.demo', password: 'Student123!', role: 'Student (has ranking)' },
  { label: 'Student B',   email: 'student2@internmatch.demo', password: 'Student123!', role: 'Student (no ranking)' },
  { label: 'Student C',   email: 'student3@internmatch.demo', password: 'Student123!', role: 'Student (unmatched)' },
  { label: 'Student D',   email: 'newstudent@internmatch.demo', password: 'Student123!', role: 'Student (new, no profile)' },
  { label: 'Company A',   email: 'company1@internmatch.demo', password: 'Company123!', role: 'Company (postings)' },
  { label: 'Company B',   email: 'company2@internmatch.demo', password: 'Company123!', role: 'Company' },
  { label: 'Company C',   email: 'newcompany@internmatch.demo', password: 'Company123!', role: 'Company (new, no profile)' },
];

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();

  function fillDemo(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.is_admin) navigate('/admin');
      else if (!user.hasProfile) navigate('/onboarding');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>Sign in to InternMatch</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          Don't have an account? <Link to="/signup?role=student" style={{ color: 'var(--color-primary-600)' }}>Sign up</Link>
        </p>

        <Card>
          {error && (
            <div style={{ background: 'var(--color-error-50)', border: '1px solid var(--color-error-500)', borderRadius: 6, padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-error-500)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Button type="submit" loading={loading} style={{ marginTop: 'var(--space-2)', width: '100%' }}>
              Sign in
            </Button>
          </form>
        </Card>

        {USE_MOCK && (
          <Card style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              Demo Accounts (click to autofill)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2)', borderRadius: 6, cursor: 'pointer', transition: 'background 150ms' }}
                  onClick={() => fillDemo(acc)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-neutral-100)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{acc.label}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-600)', marginLeft: 8 }}>{acc.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEmail(acc.email); setPassword(acc.password); setTimeout(() => document.querySelector('form').requestSubmit(), 50); }}
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 8px' }}>
                    Sign in →
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
