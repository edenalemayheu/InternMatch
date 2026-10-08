/**
 * Signup — /signup?role=student|company
 * Role is read from query param (read-only badge).
 * Validates email format, password length, confirm match.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Card   from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input  from '../components/ui/Input.jsx';
import Badge  from '../components/ui/Badge.jsx';

function validate(email, password, confirm) {
  const errs = {};
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email address.';
  if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
  if (password !== confirm) errs.confirm = 'Passwords do not match.';
  return errs;
}

export default function Signup() {
  const [params]   = useSearchParams();
  const role       = params.get('role') || 'student';
  const navigate   = useNavigate();
  const { signup } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(email, password, confirm);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      const user = await signup(email, password, role);
      navigate('/onboarding');
    } catch (err) {
      setApiError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>Create your account</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary-600)' }}>Sign in</Link>
        </p>

        <Card>
          <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Signing up as:</span>
            <Badge variant={role === 'student' ? 'shortlisted' : 'info'}>
              {role === 'student' ? 'Student' : 'Company'}
            </Badge>
          </div>

          {apiError && (
            <div style={{ background: 'var(--color-error-50)', border: '1px solid var(--color-error-500)', borderRadius: 6, padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-error-500)' }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" error={errors.email} required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" error={errors.password} required />
            <Input label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" error={errors.confirm} required />
            <Button type="submit" loading={loading} style={{ marginTop: 'var(--space-2)', width: '100%' }}>
              Create account
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
          {role === 'student'
            ? <><Link to="/signup?role=company" style={{ color: 'var(--color-primary-600)' }}>Sign up as a company instead</Link></>
            : <><Link to="/signup?role=student" style={{ color: 'var(--color-primary-600)' }}>Sign up as a student instead</Link></>
          }
        </p>
      </div>
    </div>
  );
}
