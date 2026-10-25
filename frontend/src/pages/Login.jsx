/**
 * Login — /login
 * Email + password, routes by role after login per spec.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Card    from '../components/ui/Card.jsx';
import Button  from '../components/ui/Button.jsx';
import Input   from '../components/ui/Input.jsx';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login, sessionExpired } = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();

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

        {sessionExpired && !error && (
          <div role="status" style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-neutral-300)', borderRadius: 6, padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', textAlign: 'center' }}>
            Your session ended. Please sign in again.
          </div>
        )}

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

      </div>
    </div>
  );
}
