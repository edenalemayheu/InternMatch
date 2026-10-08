/**
 * Admin Match Results — /admin/results
 * Scored pairs table, matched pairs, unmatched students, unfilled postings.
 * Visual board: columns per posting with matched students as chips.
 */
import { useState, useEffect } from 'react';
import { useRound } from '@/context/RoundContext';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import { useToastContext } from '@/components/Toast';
import * as api from '@/data/api';

const STUDENT_MAP_CACHE = {};
const COMPANY_MAP_CACHE = {};

function ScorePill({ score }) {
  const c = score >= 1.5 ? 'var(--color-accent)' : score >= 1 ? 'var(--color-primary)' : 'var(--color-ink-3)';
  return <span style={{ padding:'1px 10px', borderRadius:'var(--radius-full)', fontSize:'var(--text-xs)', fontWeight:700, background:`color-mix(in srgb, ${c} 15%, transparent)`, color:c }}>{score?.toFixed ? score.toFixed(4) : score}</span>;
}

function StatusChip({ matched, reason }) {
  const c = matched ? 'var(--color-accent)' : 'var(--color-ink-3)';
  const label = matched ? 'Matched' : (reason ?? 'Skipped');
  return <span style={{ padding:'1px 8px', borderRadius:'var(--radius-full)', fontSize:'10px', fontWeight:600, background:`color-mix(in srgb, ${c} 15%, transparent)`, color:c, whiteSpace:'nowrap' }}>{label}</span>;
}

export default function AdminMatchResults() {
  const { phase }              = useRound();
  const { toast }              = useToastContext();
  const [data,      setData]   = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [view,      setView]     = useState('board'); // 'board' | 'pairs' | 'scored'

  useEffect(() => {
    Promise.all([api.getAllData(), api.getMatchResults()])
      .then(([d, mr]) => {
        setData(d);
        setMatchData(mr);
        // Cache maps
        for(const s of d.students) STUDENT_MAP_CACHE[s.id] = s;
        for(const c of d.companies) { for(const p of d.postings.filter(x=>x.company_id===c.id)) COMPANY_MAP_CACHE[p.id] = c; }
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  if(loading) return <div style={{ maxWidth:1200,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={4} height="80px" /></div>;
  if(!data || !matchData) return null;

  const { students, postings } = data;
  const matches = matchData.matches ?? [];

  // Build matched student IDs set
  const matchedStudentIds = new Set(matches.map(m=>m.student_id));
  const unmatchedStudents = students.filter(s=>!matchedStudentIds.has(s.id));

  // Unfilled: postings where filled < capacity
  const filledByPosting = {};
  for(const m of matches) { filledByPosting[m.posting_id] = (filledByPosting[m.posting_id]??0)+1; }
  const unfilledPostings = postings.filter(p=>( filledByPosting[p.id]??0) < p.capacity);

  // Get scored pairs from the latest match run (not stored, reconstruct from matches)
  // We will show matches as scored pairs
  const scoredRows = matches.map(m=>{
    const student = STUDENT_MAP_CACHE[m.student_id];
    const posting = postings.find(p=>p.id===m.posting_id);
    const company = COMPANY_MAP_CACHE[m.posting_id];
    return { ...m, studentName: student?.full_name??m.student_id, postingTitle: posting?.title??m.posting_id, companyName: company?.company_name??'' };
  }).sort((a,b)=>(b.mutual_score??0)-(a.mutual_score??0));

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'var(--space-8) var(--space-6)' }}>
      <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-3xl)', fontWeight:800, color:'var(--color-ink)', marginBottom:'var(--space-2)' }}>Match Results</h1>
      <p style={{ color:'var(--color-ink-2)', marginBottom:'var(--space-6)' }}>Phase: <strong>{phase?.replace(/_/g,' ')}</strong> · {matches.length} match{matches.length!==1?'es':''} · {unmatchedStudents.length} unmatched · {unfilledPostings.length} unfilled</p>

      {/* View toggle */}
      <div style={{ display:'flex', gap:'var(--space-1)', marginBottom:'var(--space-6)', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-lg)', padding:4, width:'fit-content' }}>
        {[['board','Visual Board'],['pairs','Matched Pairs'],['scored','Score Table']].map(([v,l])=>(
          <button key={v} type="button" onClick={()=>setView(v)}
            style={{ padding:'var(--space-2) var(--space-4)', borderRadius:'var(--radius-md)', border:'none', cursor:'pointer', fontSize:'var(--text-sm)', fontWeight:600, background:view===v?'var(--color-primary)':'transparent', color:view===v?'white':'var(--color-ink-2)', transition:'all var(--transition-fast)', minHeight:'36px' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'board' && (
        <>
          <div style={{ overflowX:'auto', paddingBottom:'var(--space-4)' }}>
            <div style={{ display:'flex', gap:'var(--space-4)', minWidth:'min-content' }}>
              {postings.map(p=>{
                const pMatches = matches.filter(m=>m.posting_id===p.id);
                const company = COMPANY_MAP_CACHE[p.id];
                const filled = pMatches.length;
                const capacity = p.capacity;
                return (
                  <div key={p.id} style={{ minWidth:'180px', maxWidth:'220px', flex:'0 0 auto' }}>
                    <GlassCard opaque radius="sm" padding="var(--space-4)" style={{ marginBottom:'var(--space-3)', background: filled>0?'color-mix(in srgb, var(--color-accent) 8%, var(--glass-bg-opaque))':undefined }}>
                      <p style={{ fontWeight:700, color:'var(--color-ink)', fontSize:'var(--text-sm)', marginBottom:'var(--space-1)', lineHeight:'var(--leading-snug)' }}>{p.title}</p>
                      <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', marginBottom:'var(--space-2)' }}>{company?.company_name}</p>
                      <p style={{ fontSize:'var(--text-xs)', color: filled>=capacity?'var(--color-accent)':'var(--color-ink-3)', fontWeight:600 }}>{filled}/{capacity} filled</p>
                    </GlassCard>
                    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                      {pMatches.map(m=>(
                        <div key={m.id} style={{ padding:'var(--space-2) var(--space-3)', background:'color-mix(in srgb, var(--color-accent) 10%, var(--glass-bg-opaque))', borderRadius:'var(--radius-sm)', border:'1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)' }}>
                          <p style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--color-ink)', marginBottom:2 }}>{m.student_name ?? STUDENT_MAP_CACHE[m.student_id]?.full_name ?? m.student_id}</p>
                          <ScorePill score={m.mutual_score} />
                        </div>
                      ))}
                      {filled < capacity && Array.from({length: capacity-filled}).map((_,i)=>(
                        <div key={i} style={{ padding:'var(--space-2) var(--space-3)', background:'var(--color-border-subtle)', borderRadius:'var(--radius-sm)', border:'1px dashed var(--color-border)' }}>
                          <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)' }}>Unfilled slot</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'var(--space-4)', marginTop:'var(--space-5)' }}>
            <GlassCard opaque radius="sm" padding="var(--space-4)">
              <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'var(--space-2)' }}>Unmatched Students</p>
              {unmatchedStudents.length === 0
                ? <p style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-3)' }}>None</p>
                : unmatchedStudents.map(s=>(
                  <p key={s.id} style={{ fontSize:'var(--text-sm)', color:'var(--color-ink)', marginBottom:'var(--space-1)' }}>{s.full_name}</p>
                ))
              }
            </GlassCard>
            <GlassCard opaque radius="sm" padding="var(--space-4)">
              <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'var(--space-2)' }}>Unfilled Postings</p>
              {unfilledPostings.length === 0
                ? <p style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-3)' }}>All filled</p>
                : unfilledPostings.map(p=>(
                  <p key={p.id} style={{ fontSize:'var(--text-sm)', color:'var(--color-ink)', marginBottom:'var(--space-1)' }}>{p.title}</p>
                ))
              }
            </GlassCard>
          </div>
        </>
      )}

      {view === 'pairs' && (
        <GlassCard opaque radius="sm" padding="0" style={{ overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--color-border)' }}>
                  {['Student','Posting','Company','Student Rank','Co. Rank','Score'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'var(--space-3) var(--space-4)', color:'var(--color-ink-3)', fontWeight:600, fontSize:'var(--text-xs)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoredRows.map(r=>(
                  <tr key={r.id} style={{ borderBottom:'1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding:'var(--space-3) var(--space-4)', fontWeight:600, color:'var(--color-ink)' }}>{r.studentName}</td>
                    <td style={{ padding:'var(--space-3) var(--space-4)', color:'var(--color-ink-2)' }}>{r.postingTitle}</td>
                    <td style={{ padding:'var(--space-3) var(--space-4)', color:'var(--color-ink-3)' }}>{r.companyName}</td>
                    <td style={{ padding:'var(--space-3) var(--space-4)', color:'var(--color-ink)' }}>#{r.student_rank ?? '?'}</td>
                    <td style={{ padding:'var(--space-3) var(--space-4)', color:'var(--color-ink)' }}>#{r.company_rank ?? '?'}</td>
                    <td style={{ padding:'var(--space-3) var(--space-4)' }}><ScorePill score={r.mutual_score} /></td>
                  </tr>
                ))}
                {scoredRows.length === 0 && <tr><td colSpan={6} style={{ padding:'var(--space-8)', textAlign:'center', color:'var(--color-ink-3)' }}>Run matching to see results</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {view === 'scored' && (
        <GlassCard opaque radius="sm" padding="var(--space-5)">
          <p style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-2)', marginBottom:'var(--space-4)' }}>
            Full scored-pairs detail is computed live from the matching run. Use the Visual Board or Matched Pairs view for summary. Run matching from the Admin Control Panel to populate results.
          </p>
          {scoredRows.length === 0
            ? <p style={{ color:'var(--color-ink-3)' }}>No matches yet. Run matching from the Control Panel.</p>
            : <p style={{ color:'var(--color-ink-2)' }}>{scoredRows.length} matched pair{scoredRows.length!==1?'s':''} stored. View in "Matched Pairs" tab.</p>
          }
        </GlassCard>
      )}
    </div>
  );
}
