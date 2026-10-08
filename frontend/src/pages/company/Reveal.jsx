/**
 * Company Match Result — /company/result
 * Visible only in revealed; matched students per posting with mutual score + explanation.
 */
import { useState, useEffect } from 'react';
import { useRound } from '@/context/RoundContext';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { useToastContext } from '@/components/Toast';
import * as api from '@/data/api';

const COMPANY_MAP = { c01:'NexaTech Software', c02:'BridgeAI', c03:'VaultFin', c04:'Studio Nova', c05:'Greenfield Analytics', c06:'OrbitUX' };

export default function CompanyReveal() {
  const { phase }              = useRound();
  const { toast }              = useToastContext();
  const [matches,   setMatches]   = useState([]);
  const [postings,  setPostings]  = useState({});
  const [students,  setStudents]  = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if(phase !== 'revealed') { setLoading(false); return; }
    Promise.all([api.getMatchResults(), api.getCompanyPostings()])
      .then(([mr, cp]) => {
        setMatches(mr.matches ?? []);
        setPostings(Object.fromEntries(cp.postings.map(p=>[p.id,p])));
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [phase]);

  if(loading) return <div style={{ maxWidth:800,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={3} height="100px" /></div>;

  if(phase !== 'revealed') {
    return (
      <div style={{ maxWidth:560, margin:'0 auto', padding:'var(--space-16) var(--space-6)', textAlign:'center' }}>
        <GlassCard padding="var(--space-12)">
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-2xl)', fontWeight:700, color:'var(--color-ink)', marginBottom:'var(--space-4)' }}>Results not yet revealed</h1>
          <p style={{ color:'var(--color-ink-2)', lineHeight:'var(--leading-normal)' }}>Match results will be revealed on Match Day, June 1, 2026. All parties see results simultaneously.</p>
        </GlassCard>
      </div>
    );
  }

  // Group matches by posting
  const byPosting = {};
  for(const m of matches) {
    if(!byPosting[m.posting_id]) byPosting[m.posting_id] = [];
    byPosting[m.posting_id].push(m);
  }

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:'var(--space-8) var(--space-6)' }}>
      <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-3xl)', fontWeight:800, color:'var(--color-ink)', marginBottom:'var(--space-2)' }}>Your Matches</h1>
      <p style={{ color:'var(--color-ink-2)', marginBottom:'var(--space-8)' }}>Results are live. Reach out to your matched students directly.</p>

      {Object.keys(byPosting).length === 0 && Object.values(postings).length > 0 ? (
        <EmptyState title="No matches this round" message="None of your postings were filled this round. Students eligible for the next round will be notified." />
      ) : (
        Object.entries(byPosting).map(([pid, pMatches]) => {
          const posting = postings[pid];
          const unfilled = (posting?.capacity ?? 1) - pMatches.length;
          return (
            <div key={pid} style={{ marginBottom:'var(--space-8)' }}>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-xl)', fontWeight:700, color:'var(--color-ink)', marginBottom:'var(--space-4)' }}>
                {posting?.title ?? pid}
                {unfilled > 0 && <span style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-3)', fontWeight:400, marginLeft:'var(--space-3)' }}>{unfilled} slot{unfilled!==1?'s':''} unfilled</span>}
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                {pMatches.map(m=>(
                  <GlassCard key={m.id} opaque radius="sm" padding="var(--space-5)" style={{ borderLeft:'3px solid var(--color-accent)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'var(--space-4)' }}>
                      <div>
                        <p style={{ fontWeight:700, color:'var(--color-ink)', marginBottom:'var(--space-1)' }}>{m.student_name ?? m.student_id}</p>
                        <p style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-3)' }}>Mutual score: <strong style={{ color:'var(--color-accent)' }}>{m.mutual_score}</strong></p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', marginBottom:4 }}>How it's calculated</p>
                        <p style={{ fontFamily:'monospace', fontSize:'var(--text-xs)', color:'var(--color-ink-2)' }}>
                          1/{m.student_rank ?? '?'} + 1/{m.company_rank ?? '?'} = {m.mutual_score}
                        </p>
                        {m.student_rank && m.company_rank && (
                          <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', marginTop:4 }}>
                            Student ranked you #{m.student_rank} · You ranked them #{m.company_rank}
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
