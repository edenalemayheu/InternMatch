/**
 * Company Applicants — /company/applicants/:postingId
 * Table of applicants sorted by rank. Shortlist status control.
 * Contact email shown only for shortlisted students when phase >= shortlist_locked.
 * Locked/read-only from shortlist_locked onward.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useRound, phaseAtLeast } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Card     from '../../components/ui/Card.jsx';
import Badge    from '../../components/ui/Badge.jsx';
import Banner   from '../../components/ui/Banner.jsx';
import Spinner  from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button   from '../../components/ui/Button.jsx';

const STATUS_OPTIONS = ['pending', 'shortlisted', 'rejected'];

function ApplicantRow({ applicant, editable, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function handleStatus(val) {
    setSaving(true);
    await onStatusChange(applicant.id, val);
    setSaving(false);
  }

  return (
    <div style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 8, marginBottom: 'var(--space-2)', background: 'var(--color-neutral-0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', flexWrap: 'wrap' }}>
        {/* Rank badge */}
        <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          #{applicant.rank_position}
        </span>

        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{applicant.full_name}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{applicant.department} · {applicant.year}</p>
          {applicant.contact_email && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontWeight: 600, marginTop: 2 }}>
              {applicant.contact_email}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(applicant.skills || []).slice(0, 4).map(s => <Badge key={s} variant="skill">{s}</Badge>)}
        </div>

        {/* Status control */}
        {editable ? (
          <select
            value={applicant.shortlist_status}
            onChange={e => handleStatus(e.target.value)}
            disabled={saving}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--color-neutral-200)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              color: applicant.shortlist_status === 'shortlisted' ? 'var(--color-primary-700)' : applicant.shortlist_status === 'rejected' ? 'var(--color-error-500)' : 'var(--color-neutral-600)',
              background: applicant.shortlist_status === 'shortlisted' ? 'var(--color-primary-100)' : applicant.shortlist_status === 'rejected' ? 'var(--color-error-50)' : 'var(--color-neutral-100)',
            }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        ) : (
          <Badge variant={applicant.shortlist_status}>{applicant.shortlist_status}</Badge>
        )}

        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)' }} aria-label="Expand profile">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 var(--space-4) var(--space-4)', borderTop: '1px solid var(--color-neutral-100)' }}>
          <div className="grid-3" style={{ marginTop: 'var(--space-4)', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>All skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(applicant.skills || []).map(s => <Badge key={s} variant="skill">{s}</Badge>)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Availability</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-800)' }}>{applicant.availability || '—'}</p>
            </div>
            {applicant.portfolio_url && (
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Portfolio</p>
                <a href={applicant.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyApplicants() {
  const { postingId } = useParams();
  const { round }     = useRound();
  const toast         = useToast();
  const [applicants, setApplicants] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const phase = round?.phase;
  const available = phaseAtLeast(phase, 'ranking_locked');
  const readOnly  = phaseAtLeast(phase, 'shortlist_locked');
  const editable  = available && !readOnly;

  function load() {
    if (!available) { setLoading(false); return; }
    api.getApplicants(postingId)
      .then(r => setApplicants(r.applicants || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [postingId, phase]);

  async function handleStatusChange(studentId, status) {
    try {
      await api.updateShortlist(postingId, studentId, status);
      setApplicants(prev => prev.map(a => a.id === studentId ? { ...a, shortlist_status: status } : a));
      toast.success(`Status updated to ${status}.`);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
        <Link to="/company/postings" style={{ color: 'var(--color-primary-600)' }}>← Postings</Link>
      </p>
      <h1 className="page-title">Applicants</h1>

      {!available && (
        <Banner variant="info">
          Student rankings haven't locked yet. Applicants will appear here once the ranking phase ends.
        </Banner>
      )}

      {available && readOnly && (
        <Banner variant="info" style={{ marginBottom: 'var(--space-5)' }}>
          Shortlist is finalized. Shortlisted students' contact emails are now visible.
        </Banner>
      )}

      {available && editable && (
        <Banner variant="info" style={{ marginBottom: 'var(--space-5)' }}>
          Mark candidates as Shortlisted or Rejected. Contact emails will be revealed when the shortlist is finalized.
        </Banner>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>
      ) : error ? (
        <Banner variant="error">{error}</Banner>
      ) : applicants.length === 0 ? (
        <EmptyState title="No applicants yet" message="No students have ranked this posting." />
      ) : (
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
            {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}, sorted by their ranking position.
          </p>
          {applicants.map(a => (
            <ApplicantRow key={a.id} applicant={a} editable={editable} onStatusChange={handleStatusChange} />
          ))}

          {editable && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <Button as={Link} to={`/company/interviews/${postingId}`} variant="secondary">
                Proceed to interviews →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
