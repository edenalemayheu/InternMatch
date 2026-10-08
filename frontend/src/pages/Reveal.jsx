/**
 * Reveal — /reveal
 * Shows match result for student or company.
 * Redirects to /dashboard if phase != revealed.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Info } from 'lucide-react';
import { useRound } from '../context/RoundContext.jsx';
import { useAuth }  from '../context/AuthContext.jsx';
import * as api     from '../lib/apiClient.js';
import Card    from '../components/ui/Card.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge   from '../components/ui/Badge.jsx';

export default function Reveal() {
  const { round, loading: roundLoading } = useRound();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [data,    setData]    = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (roundLoading) return;
    if (round?.phase !== 'revealed') {
      navigate('/dashboard', { replace: true });
      return;
    }
    api.getMyMatches()
      .then(d => setData(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [round?.phase, roundLoading]);

  if (roundLoading || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 'var(--space-16)' }}>
        <p style={{ color: 'var(--color-neutral-600)' }}>{error}</p>
      </div>
    );
  }

  // ── Student view ──────────────────────────────────────────────────────────
  if (user?.role === 'student') {
    const match = data?.match;
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 className="page-title">Match Day Results</h1>
        <p className="page-subtitle">Spring 2026 round results are now live.</p>

        {match ? (
          <Card style={{ borderLeft: '4px solid var(--color-accent-500)', background: 'var(--color-accent-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <CheckCircle size={28} color="var(--color-accent-600)" />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>You've been matched!</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Company</p>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{match.company?.company_name || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Role</p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-neutral-800)' }}>{match.posting?.title || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Mutual interest score</p>
                <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-accent-600)' }}>{match.mutual_score?.toFixed(4)}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 2 }}>score = 1/(your rank of them) + 1/(their rank of you)</p>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginTop: 'var(--space-2)' }}>
                {match.company?.contact_person} will be in touch. Congratulations!
              </p>
            </div>
          </Card>
        ) : (
          <Card style={{ borderLeft: '4px solid var(--color-neutral-300)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <Info size={24} color="var(--color-neutral-500)" />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>Not matched this round</h2>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-neutral-600)', lineHeight: 1.6 }}>
              You weren't matched this round — you're automatically eligible for the next round. This is a normal outcome; there were more students than available spots.
            </p>
          </Card>
        )}
      </div>
    );
  }

  // ── Company view ──────────────────────────────────────────────────────────
  const matches = data?.matches || [];
  return (
    <div>
      <h1 className="page-title">Match Day Results</h1>
      <p className="page-subtitle">Students matched to your postings this round.</p>

      {matches.length === 0 ? (
        <Card>
          <p style={{ color: 'var(--color-neutral-600)' }}>None of your postings were matched this round.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {matches.map(m => (
            <Card key={m.id} style={{ borderLeft: '4px solid var(--color-accent-500)', background: 'var(--color-accent-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Posting</p>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-2)' }}>{m.posting?.title}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Student</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-neutral-800)' }}>{m.student?.full_name}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontWeight: 600 }}>{m.student?.contact_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant="matched">Matched</Badge>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', marginTop: 8 }}>Score: {m.mutual_score?.toFixed(4)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
