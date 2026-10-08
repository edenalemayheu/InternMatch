/**
 * Company Dashboard — /dashboard (company view)
 * Phase stepper, summary cards, links to postings/applicants, revealed matches.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRound, PHASE_LABELS, phaseAtLeast } from '../../context/RoundContext.jsx';
import * as api from '../../lib/apiClient.js';
import Stepper  from '../../components/ui/Stepper.jsx';
import Card     from '../../components/ui/Card.jsx';
import Banner   from '../../components/ui/Banner.jsx';
import Spinner  from '../../components/ui/Spinner.jsx';
import Button   from '../../components/ui/Button.jsx';

const PHASE_MESSAGES = {
  ranking_open:     'Students are building their ranked lists.',
  ranking_locked:   'Student rankings are locked. Review your applicants.',
  shortlisting:     'Shortlist your candidates.',
  shortlist_locked: 'Shortlists are finalized. Shortlisted students have been notified.',
  interviewing:     'Interviews are in progress.',
  company_ranking:  'Submit your final candidate rankings.',
  company_locked:   'Company rankings are locked.',
  matched:          'Matching is complete. Results will be revealed on Match Day.',
  revealed:         'Match Day has arrived. View your results.',
};

export default function CompanyDashboard() {
  const { round, loading: roundLoading } = useRound();
  const [postings, setPostings] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const phase = round?.phase;

  useEffect(() => {
    Promise.all([
      api.getMyPostings(),
      api.getCompanyStats(),
    ]).then(([p, s]) => {
      setPostings(p.postings || []);
      setStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [phase]);

  useEffect(() => {
    if (phase === 'revealed') {
      api.getMyMatches().then(r => setMatches(r.matches || [])).catch(() => {});
    }
  }, [phase]);

  if (roundLoading || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;
  }

  return (
    <div>
      <h1 className="page-title">Company Dashboard</h1>

      {/* Phase stepper */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <Stepper currentPhase={phase} />
        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
          {PHASE_MESSAGES[phase] || `Phase: ${PHASE_LABELS[phase]}`}
        </p>
      </Card>

      {/* Summary cards */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Postings', value: stats.postingsCount,   icon: Briefcase,    link: '/company/postings' },
            { label: 'Applicants', value: stats.applicantsCount, icon: Users,        link: null },
            { label: 'Shortlisted', value: stats.shortlistedCount, icon: CheckCircle2, link: null },
          ].map(s => (
            <Card key={s.label} hover={!!s.link} style={{ cursor: s.link ? 'pointer' : 'default' }}
              onClick={() => s.link && (window.location.href = s.link)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>{s.value}</p>
                </div>
                <s.icon size={20} color="var(--color-neutral-400)" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Revealed matches */}
      {phase === 'revealed' && matches.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-4)' }}>Matched students</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {matches.map(m => (
              <Card key={m.id} style={{ borderLeft: '4px solid var(--color-accent-500)', background: 'var(--color-accent-50)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{m.student?.full_name}</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{m.posting?.title}</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontWeight: 600 }}>{m.student?.contact_email}</p>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-600)', fontWeight: 700 }}>Score: {m.mutual_score?.toFixed(3)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Postings list with applicant links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>My Postings</h2>
        <Button as={Link} to="/company/postings" variant="secondary" style={{ fontSize: 'var(--text-sm)' }}>Manage postings</Button>
      </div>

      {postings.length === 0 ? (
        <Card>
          <p style={{ color: 'var(--color-neutral-600)', textAlign: 'center', padding: 'var(--space-6)' }}>
            No postings yet. <Link to="/company/postings" style={{ color: 'var(--color-primary-600)' }}>Create your first posting</Link>.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {postings.map(p => (
            <Card key={p.id} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{p.title}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                    {p.required_department || 'Any dept.'} · Capacity: {p.capacity}
                  </p>
                </div>
                {phaseAtLeast(phase, 'ranking_locked') && (
                  <Link to={`/company/applicants/${p.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                    View applicants <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
