/**
 * Student Dashboard — /dashboard (student view)
 * Phase stepper, status message, primary action card, notifications, reveal link.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, CheckCircle } from 'lucide-react';
import { useRound, PHASE_LABELS, phaseAtLeast } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Stepper    from '../../components/ui/Stepper.jsx';
import Card       from '../../components/ui/Card.jsx';
import Banner     from '../../components/ui/Banner.jsx';
import Spinner    from '../../components/ui/Spinner.jsx';
import Button     from '../../components/ui/Button.jsx';

const PHASE_MESSAGES = {
  ranking_open:     'Ranking is open. Browse postings and build your ranked list.',
  ranking_locked:   'Ranking is locked. Companies are reviewing applicants.',
  shortlisting:     'Companies are shortlisting candidates.',
  shortlist_locked: 'Shortlists are finalized. Check your notifications.',
  interviewing:     'Interviews are in progress.',
  company_ranking:  'Companies are submitting their final rankings.',
  company_locked:   'All rankings are locked. Matching is about to run.',
  matched:          'Matching complete. Results will be revealed on Match Day.',
  revealed:         'Match Day has arrived. View your result.',
};

export default function StudentDashboard() {
  const { round, loading: roundLoading } = useRound();
  const toast = useToast();
  const [ranking,       setRanking]       = useState(undefined);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading,   setDataLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.getMyRanking(), api.getNotifications()])
      .then(([r, n]) => {
        setRanking(r.ranking);
        setNotifications(n.notifications);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [round?.phase]);

  async function markRead(id) {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  if (roundLoading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;
  }

  const phase = round?.phase;
  const unread = notifications.filter(n => !n.read);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {/* Phase stepper */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <Stepper currentPhase={phase} />
        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
          {PHASE_MESSAGES[phase] || `Current phase: ${PHASE_LABELS[phase]}`}
        </p>
      </Card>

      <div className="grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left column — main action + reveal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Revealed result card */}
          {phase === 'revealed' && (
            <Card style={{ borderLeft: '4px solid var(--color-accent-500)', background: 'var(--color-accent-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <CheckCircle size={20} color="var(--color-accent-600)" />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>Match Day results are live</h2>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>Your match result is ready to view.</p>
              <Button as={Link} to="/reveal">View my result</Button>
            </Card>
          )}

          {/* Primary action card */}
          {phase === 'ranking_open' && (
            <Card hover>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-2)' }}>
                {ranking ? 'Continue ranking' : 'Start ranking'}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                {ranking
                  ? `You have ${ranking.ordered_posting_ids?.length} postings ranked.`
                  : 'Browse postings and build your ranked list.'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {!ranking && <Button as={Link} to="/postings">Browse postings</Button>}
                {ranking && <Button as={Link} to="/rank">Edit my ranking</Button>}
                {ranking && <Button as={Link} to="/postings" variant="secondary">Browse more</Button>}
              </div>
            </Card>
          )}

          {phase !== 'ranking_open' && phase !== 'revealed' && (
            <Card>
              <Banner variant="info">
                <strong>{PHASE_LABELS[phase]}:</strong> {PHASE_MESSAGES[phase]}
              </Banner>
              {ranking && (
                <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                  Your ranking ({ranking.ordered_posting_ids?.length} postings) is locked and submitted.
                </p>
              )}
              {!ranking && (
                <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                  You did not submit a ranking this round.
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right column — notifications */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Bell size={18} />
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>Notifications</h2>
            {unread.length > 0 && (
              <span style={{ background: 'var(--color-primary-600)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{unread.length}</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>No notifications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: 'var(--space-4)', borderRadius: 8, background: n.read ? 'var(--color-neutral-50)' : 'var(--color-primary-50)',
                  border: `1px solid ${n.read ? 'var(--color-neutral-200)' : 'var(--color-primary-300)'}`,
                  cursor: n.read ? 'default' : 'pointer',
                }} onClick={() => !n.read && markRead(n.id)}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)', fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                  {!n.read && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', marginTop: 4 }}>Click to mark as read</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
