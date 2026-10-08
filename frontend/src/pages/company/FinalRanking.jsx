/**
 * Company Final Ranking — /company/final-ranking/:postingId
 * DnD ordered list of shortlisted students per posting.
 * Score toggle (1-10 per student). Lock confirmation modal. Read-only after company_locked.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRound } from '@/context/RoundContext';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToastContext } from '@/components/Toast';
import * as api from '@/data/api';

const ACTIVE_PHASES = ['interviewing','company_ranking'];

function SortableItem({ item, index, total, onUp, onDown, score, onScore, showScores, locked }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0 };
  return (
    <div ref={setNodeRef} style={style}>
      <GlassCard opaque radius="sm" padding="var(--space-4)" style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', opacity:isDragging?0.85:1 }}>
        <span style={{ width:28,height:28,borderRadius:'50%',background:'var(--color-primary-light)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'var(--text-sm)',fontWeight:800,flexShrink:0 }}>{index+1}</span>
        {!locked && (
          <button {...attributes} {...listeners} type="button" aria-label="Drag to reorder"
            style={{ background:'none',border:'none',cursor:'grab',color:'var(--color-ink-3)',padding:'var(--space-1)',minHeight:'44px',minWidth:'36px',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="3" r="1.5"/><circle cx="10" cy="3" r="1.5"/>
              <circle cx="4" cy="7" r="1.5"/><circle cx="10" cy="7" r="1.5"/>
              <circle cx="4" cy="11" r="1.5"/><circle cx="10" cy="11" r="1.5"/>
            </svg>
          </button>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:600, color:'var(--color-ink)' }}>{item.full_name}</p>
          <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)' }}>{item.department}</p>
        </div>
        {showScores && !locked && (
          <select value={score ?? 5} onChange={e=>onScore(item.id, +e.target.value)}
            style={{ fontSize:'var(--text-xs)',padding:'var(--space-1) var(--space-2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--color-border)',background:'var(--glass-bg)',color:'var(--color-ink)',minHeight:'36px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        )}
        {!locked && (
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <button type="button" onClick={()=>onUp(index)} disabled={index===0} aria-label="Move up"
              style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-ink-3)',padding:2,minHeight:'22px',display:'flex',alignItems:'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 2l4 5H2l4-5z"/></svg>
            </button>
            <button type="button" onClick={()=>onDown(index)} disabled={index===total-1} aria-label="Move down"
              style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-ink-3)',padding:2,minHeight:'22px',display:'flex',alignItems:'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 10L2 5h8l-4 5z"/></svg>
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function CompanyFinalRanking() {
  const { postingId: rawPostingId }  = useParams();
  const { phase }      = useRound();
  const { toast }      = useToastContext();

  // When no postingId, show posting selector
  const [myPostings, setMyPostings] = useState([]);
  const [postingId, setPostingId] = useState(rawPostingId ?? null);

  useEffect(() => {
    if (!rawPostingId) {
      api.getCompanyPostings().then(r => { setMyPostings(r.postings); if(r.postings.length===1) setPostingId(r.postings[0].id); }).catch(()=>{});
    }
  }, [rawPostingId]);
  const locked         = !ACTIVE_PHASES.includes(phase);
  const [posting,  setPosting]  = useState(null);
  const [items,    setItems]    = useState([]);
  const [scores,   setScores]   = useState({});
  const [showScores,setShowScores] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveState,setSaveState]= useState('idle');
  const [confirm,  setConfirm]  = useState(false);
  const saveTimer = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if(!postingId) return;
    Promise.all([api.getPosting(postingId), api.getShortlist(postingId)])
      .then(([p, sl]) => {
        setPosting(p.posting);
        const students = sl.shortlist.map(s=>s.student).filter(Boolean);
        setItems(students);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [postingId]);

  const autosave = useCallback(async (newItems, newScores) => {
    if(locked) return;
    clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await api.saveCompanyRanking(postingId, {
          ordered_student_ids: newItems.map(i=>i.id),
          scores: newScores,
        });
        setSaveState('saved');
        setTimeout(()=>setSaveState('idle'), 2000);
      } catch(e) { toast.error(e.message); setSaveState('idle'); }
    }, 600);
  }, [locked, postingId]);

  function handleDragEnd(e) {
    const { active, over } = e;
    if(!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i=>i.id===active.id);
    const newIdx = items.findIndex(i=>i.id===over.id);
    const next   = arrayMove(items, oldIdx, newIdx);
    setItems(next); autosave(next, scores);
  }
  function moveUp(idx)   { if(idx===0) return; const next=arrayMove(items,idx,idx-1); setItems(next); autosave(next,scores); }
  function moveDown(idx) { if(idx===items.length-1) return; const next=arrayMove(items,idx,idx+1); setItems(next); autosave(next,scores); }
  function setScore(id, val) { const next={...scores,[id]:val}; setScores(next); autosave(items,next); }

  async function confirmLock() {
    setSaving(true);
    try {
      await api.saveCompanyRanking(postingId, { ordered_student_ids: items.map(i=>i.id), scores });
      toast.success('Ranking locked.');
      setConfirm(false);
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if(!postingId) {
    if(myPostings.length === 0) return <div style={{ maxWidth:700,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={2} height="72px" /></div>;
    return (
      <div style={{ maxWidth:700,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}>
        <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-3xl)',fontWeight:800,color:'var(--color-ink)',marginBottom:'var(--space-6)' }}>Final Ranking — Select Posting</h1>
        <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-3)' }}>
          {myPostings.map(p=>(
            <GlassCard key={p.id} opaque radius="sm" padding="var(--space-5)" hover>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div><p style={{ fontWeight:700,color:'var(--color-ink)' }}>{p.title}</p><p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-3)' }}>Capacity: {p.capacity}</p></div>
                <button type="button" onClick={()=>setPostingId(p.id)} className="btn btn--primary btn--sm">Rank</button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if(loading) return <div style={{ maxWidth:700,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={4} height="72px" /></div>;

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:'var(--space-8) var(--space-6)' }}>
      <Link to="/company/postings" style={{ fontSize:'var(--text-sm)', color:'var(--color-primary)', display:'inline-block', marginBottom:'var(--space-4)' }}>← Postings</Link>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-3xl)', fontWeight:800, color:'var(--color-ink)', marginBottom:'var(--space-1)' }}>Final Ranking</h1>
          {posting && <p style={{ color:'var(--color-ink-2)' }}>{posting.title}</p>}
        </div>
        <div style={{ display:'flex', gap:'var(--space-3)', alignItems:'center' }}>
          {saveState !== 'idle' && (
            <span style={{ fontSize:'var(--text-xs)', color:saveState==='saved'?'var(--color-accent)':'var(--color-ink-3)', fontWeight:600 }}>{saveState==='saving'?'Saving…':'Saved'}</span>
          )}
          {!locked && (
            <>
              <label style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', fontSize:'var(--text-sm)', color:'var(--color-ink-2)', cursor:'pointer', userSelect:'none' }}>
                <input type="checkbox" checked={showScores} onChange={e=>setShowScores(e.target.checked)} style={{ width:18,height:18,accentColor:'var(--color-primary)',cursor:'pointer' }} />
                Scores
              </label>
              <Button variant="primary" size="sm" onClick={()=>setConfirm(true)}>Lock ranking</Button>
            </>
          )}
        </div>
      </div>

      {locked && (
        <GlassCard padding="var(--space-4)" style={{ marginBottom:'var(--space-5)', borderLeft:'4px solid var(--color-warning)', background:'var(--color-warning-light)' }}>
          <p style={{ fontSize:'var(--text-sm)', color:'var(--color-warning)', fontWeight:600 }}>Rankings are locked for this phase. View only.</p>
        </GlassCard>
      )}

      {items.length === 0 ? (
        <EmptyState title="No shortlisted students" message="Shortlist students from the Applicants page first." action={<Link to={`/company/applicants/${postingId}`} className="btn btn--primary btn--md">View applicants</Link>} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
              {items.map((item,idx)=>(
                <SortableItem key={item.id} item={item} index={idx} total={items.length}
                  onUp={moveUp} onDown={moveDown}
                  score={scores[item.id]} onScore={setScore}
                  showScores={showScores} locked={locked} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={confirm} onClose={()=>setConfirm(false)} title="Lock your ranking?" size="sm">
        <p style={{ color:'var(--color-ink-2)', marginBottom:'var(--space-6)', lineHeight:'var(--leading-normal)' }}>
          This saves your final candidate order for <strong>{posting?.title}</strong>. You can still edit it until the round is locked.
        </p>
        <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
          <Button variant="ghost" size="md" onClick={()=>setConfirm(false)}>Cancel</Button>
          <Button variant="primary" size="md" loading={saving} onClick={confirmLock}>Confirm &amp; lock</Button>
        </div>
      </Modal>
    </div>
  );
}
