/**
 * Admin Panel — /admin
 * Phase stepper, force advance, run matching, reset round, data tables.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRound, PHASE_LABELS, PHASE_SEQUENCE } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Stepper  from '../../components/ui/Stepper.jsx';
import Card     from '../../components/ui/Card.jsx';
import Button   from '../../components/ui/Button.jsx';
import Badge    from '../../components/ui/Badge.jsx';
import Spinner  from '../../components/ui/Spinner.jsx';
import Table    from '../../components/ui/Table.jsx';
import Banner   from '../../components/ui/Banner.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';

export default function AdminPanel() {
  const { round, loading: roundLoading, refresh } = useRound();
  const toast = useToast();
  const [advancing, setAdvancing] = useState(false);
  const [running,   setRunning]   = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [matchResult, setMatchResult]   = useState(null);
  const [tab,         setTab]           = useState('rankings');
  const [tabData,     setTabData]       = useState({});
  const [tabLoading,  setTabLoading]    = useState(false);

  async function loadTab(t) {
    setTabLoading(true);
    try {
      let data;
      if (t === 'rankings')    data = await api.adminListRankings();
      if (t === 'company')     data = await api.adminListCompanyRankings();
      if (t === 'shortlists')  data = await api.adminListShortlists();
      if (t === 'students')    data = await api.adminListStudents();
      if (t === 'companies')   data = await api.adminListCompanies();
      setTabData(d => ({ ...d, [t]: data }));
    } catch (e) { toast.error(e.message); }
    setTabLoading(false);
  }

  useEffect(() => { loadTab(tab); }, [tab]);

  async function advance() {
    setAdvancing(true);
    try {
      const { round: r } = await api.advancePhase();
      await refresh();
      toast.success(`Phase advanced to: ${PHASE_LABELS[r.phase]}`);
    } catch (err) { toast.error(err.message); }
    setAdvancing(false);
  }

  async function runMatching() {
    setRunning(true);
    try {
      const result = await api.runMatchingNow();
      setMatchResult(result);
      await refresh();
      toast.success(`Matching complete: ${result.matched.length} match${result.matched.length !== 1 ? 'es' : ''}.`);
    } catch (err) { toast.error(err.message); }
    setRunning(false);
  }

  async function doReset() {
    setResetting(true);
    try {
      await api.resetRound();
      setMatchResult(null);
      await refresh();
      toast.success('Round reset to ranking_open.');
    } catch (err) { toast.error(err.message); }
    setResetting(false);
    setConfirmReset(false);
  }

  if (roundLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;

  const phase = round?.phase;
  const atEnd = phase === 'revealed';

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>
      <p className="page-subtitle">Round control — {round?.label}</p>

      {/* Phase stepper */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)', overflowX: 'auto' }}>
        <Stepper currentPhase={phase} />
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
          Current phase: {PHASE_LABELS[phase]}
        </p>
      </Card>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <Button onClick={advance} loading={advancing} disabled={atEnd}>
          Force advance to next phase
        </Button>
        <Button onClick={runMatching} loading={running} variant="secondary">
          Run matching algorithm now
        </Button>
        <Button onClick={() => setConfirmReset(true)} variant="destructive">
          Reset round
        </Button>
      </div>

      {atEnd && (
        <Banner variant="info" style={{ marginBottom: 'var(--space-5)' }}>
          Round is at the final phase (Revealed). Reset the round to start again.
        </Banner>
      )}

      {/* Match results */}
      {matchResult && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-4)' }}>Matching Results</h2>

          {/* Matched pairs */}
          <Card style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="var(--color-accent-600)" /> Matched pairs ({matchResult.matched.length})
            </h3>
            <Table
              columns={[
                { key: 'student_name',  label: 'Student' },
                { key: 'posting_title', label: 'Posting' },
                { key: 'company_name',  label: 'Company' },
                { key: 'mutual_score',  label: 'Score', render: r => r.mutual_score?.toFixed(4) },
              ]}
              rows={matchResult.matched}
              emptyMessage="No matches found."
            />
          </Card>

          {/* Unmatched students */}
          <Card style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-3)' }}>
              Unmatched students ({matchResult.unmatched_students.length})
            </h3>
            <Table
              columns={[{ key: 'full_name', label: 'Student' }, { key: 'id', label: 'ID' }]}
              rows={matchResult.unmatched_students}
              emptyMessage="All students were matched."
            />
          </Card>

          {/* Unmatched postings */}
          <Card>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-3)' }}>
              Unmatched / partially-filled postings ({matchResult.unmatched_postings.length})
            </h3>
            <Table
              columns={[{ key: 'title', label: 'Posting' }, { key: 'company_name', label: 'Company' }, { key: 'id', label: 'ID' }]}
              rows={matchResult.unmatched_postings}
              emptyMessage="All postings were filled."
            />
          </Card>
        </div>
      )}

      {/* Data tables */}
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-4)' }}>Round Data</h2>
      <Card>
        <div className="tabs">
          {[
            { key: 'rankings',   label: 'Student Rankings' },
            { key: 'company',    label: 'Company Rankings' },
            { key: 'shortlists', label: 'Shortlists' },
            { key: 'students',   label: 'Students' },
            { key: 'companies',  label: 'Companies' },
          ].map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'tab-btn--active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tabLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><Spinner /></div>
        ) : (
          <>
            {tab === 'rankings' && (
              <Table
                columns={[
                  { key: 'student_id',  label: 'Student ID' },
                  { key: 'ordered_posting_ids', label: 'Ranked postings', render: r => (r.ordered_posting_ids || []).join(', ') },
                  { key: 'locked_at',   label: 'Locked', render: r => r.locked_at ? 'Yes' : 'No' },
                ]}
                rows={tabData.rankings?.rankings || []}
                emptyMessage="No student rankings submitted."
              />
            )}
            {tab === 'company' && (
              <Table
                columns={[
                  { key: 'posting_id', label: 'Posting ID' },
                  { key: 'ordered_student_ids', label: 'Ranked students', render: r => (r.ordered_student_ids || []).join(', ') || (r.scores ? JSON.stringify(r.scores) : '—') },
                  { key: 'locked_at',  label: 'Locked', render: r => r.locked_at ? 'Yes' : 'No' },
                ]}
                rows={tabData.company?.rankings || []}
                emptyMessage="No company rankings submitted."
              />
            )}
            {tab === 'shortlists' && (
              <Table
                columns={[
                  { key: 'posting_id', label: 'Posting ID' },
                  { key: 'student_id', label: 'Student ID' },
                  { key: 'shortlist_status', label: 'Status', render: r => <Badge variant={r.shortlist_status}>{r.shortlist_status}</Badge> },
                ]}
                rows={tabData.shortlists?.shortlists || []}
                emptyMessage="No shortlist entries."
              />
            )}
            {tab === 'students' && (
              <Table
                columns={[
                  { key: 'full_name',   label: 'Name' },
                  { key: 'department',  label: 'Department' },
                  { key: 'year',        label: 'Year' },
                  { key: 'skills',      label: 'Skills', render: r => (r.skills || []).join(', ') },
                ]}
                rows={tabData.students?.students || []}
                emptyMessage="No students."
              />
            )}
            {tab === 'companies' && (
              <Table
                columns={[
                  { key: 'company_name',   label: 'Company' },
                  { key: 'industry',       label: 'Industry' },
                  { key: 'contact_person', label: 'Contact' },
                ]}
                rows={tabData.companies?.companies || []}
                emptyMessage="No companies."
              />
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        title="Reset round?"
        message="This will wipe all student rankings, company rankings, shortlists, and matches for the current round, and reset the phase to ranking_open. This cannot be undone."
        confirmLabel="Reset round"
        loading={resetting}
      />
    </div>
  );
}
