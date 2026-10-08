/**
 * Student Postings — /postings
 * Grid of posting cards, relevant/all toggle, "Add to ranking" CTA.
 * Locked state when phase != ranking_open.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Check, Filter } from 'lucide-react';
import { useRound } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Card      from '../../components/ui/Card.jsx';
import Badge     from '../../components/ui/Badge.jsx';
import Banner    from '../../components/ui/Banner.jsx';
import Spinner   from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button    from '../../components/ui/Button.jsx';

export default function StudentPostings() {
  const { round } = useRound();
  const toast = useToast();
  const [relevant,   setRelevant]   = useState([]);
  const [all,        setAll]        = useState([]);
  const [showAll,    setShowAll]    = useState(false);
  const [ranking,    setRanking]    = useState([]);
  const [loading,    setLoading]    = useState(true);

  const phase  = round?.phase;
  const locked = phase && phase !== 'ranking_open';
  const postings = showAll ? all : relevant;

  useEffect(() => {
    Promise.all([
      api.getPostings({ all: false }),
      api.getPostings({ all: true }),
      api.getMyRanking(),
    ]).then(([rel, allRes, rank]) => {
      setRelevant(rel.postings || []);
      setAll(allRes.postings || []);
      setRanking(rank.ranking?.ordered_posting_ids || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Load companies for display
  const [companyMap, setCompanyMap] = useState({});
  useEffect(() => {
    // Try to get company names from mock seed data (mock mode only)
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      import('../../lib/mock/seedData.js').then(m => {
        const map = {};
        for (const c of m.SEED_COMPANIES) map[c.id] = c.company_name;
        setCompanyMap(map);
      }).catch(() => {});
    }
  }, []);

  async function addToRanking(postingId) {
    const updated = [...ranking, postingId];
    await api.saveRanking(updated);
    setRanking(updated);
    toast.success('Added to your ranking.');
  }

  async function removeFromRanking(postingId) {
    const updated = ranking.filter(id => id !== postingId);
    await api.saveRanking(updated);
    setRanking(updated);
    toast.info('Removed from your ranking.');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Browse Postings</h1>
          <p className="page-subtitle">{postings.length} posting{postings.length !== 1 ? 's' : ''} {showAll ? 'total' : 'relevant to you'}</p>
        </div>
        <button
          onClick={() => setShowAll(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-neutral-200)', background: showAll ? 'var(--color-primary-50)' : 'var(--color-neutral-0)', color: showAll ? 'var(--color-primary-700)' : 'var(--color-neutral-600)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          <Filter size={14} />
          {showAll ? 'Showing all' : 'Relevant to me'}
        </button>
      </div>

      {locked && (
        <Banner variant="warning" style={{ marginBottom: 'var(--space-6)' }}>
          Ranking is closed for this phase. You can browse postings but cannot add to your ranking.
        </Banner>
      )}

      {postings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No postings found"
          message={showAll ? 'No postings have been created for this round.' : 'No postings match your department or skills. Try "Show all" to see all postings.'}
          action={!showAll && <button onClick={() => setShowAll(true)} className="btn btn--secondary">Show all postings</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {postings.map(p => {
            const added = ranking.includes(p.id);
            return (
              <Card key={p.id} hover>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    {companyMap[p.company_id] || p.company_id}
                  </p>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{p.title}</h3>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
                  {p.required_department && <Badge variant="info">{p.required_department}</Badge>}
                  {(p.required_skills || []).map(s => <Badge key={s} variant="skill">{s}</Badge>)}
                  <Badge variant="pending">Capacity: {p.capacity}</Badge>
                </div>

                {locked ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-400)' }}>Ranking is closed</p>
                ) : added ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--color-accent-600)', fontWeight: 600 }}>
                      <Check size={14} /> Added to ranking
                    </span>
                    <button onClick={() => removeFromRanking(p.id)} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                  </div>
                ) : (
                  <button onClick={() => addToRanking(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary-600)', background: 'none', border: '1px solid var(--color-primary-300)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                    <Plus size={14} /> Add to ranking
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {ranking.length > 0 && !locked && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 'var(--z-above)' }}>
          <Button as={Link} to="/rank">
            View my ranking ({ranking.length}) →
          </Button>
        </div>
      )}
    </div>
  );
}
