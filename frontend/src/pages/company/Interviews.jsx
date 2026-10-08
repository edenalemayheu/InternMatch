/**
 * Company Interviews — /company/interviews/:postingId
 * Shortlisted students only. Interview notes. Score 1-10 or drag-reorder.
 * Submit Final Ranking — only enabled in interviewing/company_ranking.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRound, phaseAtLeast } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Card     from '../../components/ui/Card.jsx';
import Banner   from '../../components/ui/Banner.jsx';
import Button   from '../../components/ui/Button.jsx';
import Spinner  from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const ACTIVE_PHASES = ['interviewing', 'company_ranking'];

function SortableStudent({ student, index, total, onUp, onDown, score, onScore, notes, onNotes, locked }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: student.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-200)', borderRadius: 8, marginBottom: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {!locked && (
          <button {...attributes} {...listeners} style={{ background: 'none', border: 'none', cursor: 'grab', color: 'var(--color-neutral-400)', padding: 4, alignSelf: 'center' }}><GripVertical size={18} /></button>
        )}

        <span style={{ minWidth: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, alignSelf: 'center' }}>{index + 1}</span>

        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>{student.full_name}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{student.department} · {student.year}</p>
          {student.contact_email && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontWeight: 600 }}>{student.contact_email}</p>}
        </div>

        {/* Score input */}
        {!locked && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--color-neutral-500)', fontWeight: 600, textTransform: 'uppercase' }}>Score</label>
            <input type="number" min="1" max="10" value={score || ''} onChange={e => onScore(student.id, +e.target.value)}
              style={{ width: 52, height: 36, borderRadius: 6, border: '1px solid var(--color-neutral-200)', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 700 }} />
          </div>
        )}

        {!locked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignSelf: 'center' }}>
            <button onClick={() => onUp(index)} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={14} /></button>
            <button onClick={() => onDown(index)} disabled={index === total - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)', opacity: index === total - 1 ? 0.3 : 1 }}><ChevronDown size={14} /></button>
          </div>
        )}

        {/* Notes */}
        <div style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontWeight: 600, textTransform: 'uppercase' }}>Interview notes</label>
          <textarea
            value={notes || ''}
            onChange={e => onNotes(student.id, e.target.value)}
            readOnly={locked}
            rows={2}
            placeholder="Add interview notes..."
            style={{ width: '100%', marginTop: 4, padding: '8px', borderRadius: 6, border: '1px solid var(--color-neutral-200)', fontSize: 'var(--text-sm)', fontFamily: "'Inter', sans-serif", resize: 'vertical', color: 'var(--color-neutral-800)', background: locked ? 'var(--color-neutral-50)' : 'var(--color-neutral-0)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CompanyInterviews() {
  const { postingId } = useParams();
  const { round }     = useRound();
  const toast         = useToast();
  const [students, setStudents] = useState([]);
  const [order,    setOrder]    = useState([]);   // student ids
  const [scores,   setScores]   = useState({});   // id → number
  const [notes,    setNotes]    = useState({});    // id → string
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const phase  = round?.phase;
  const active = ACTIVE_PHASES.includes(phase);
  const locked = phaseAtLeast(phase, 'company_locked');

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    api.getShortlistedStudents(postingId)
      .then(r => {
        setStudents(r.students || []);
        setOrder((r.students || []).map(s => s.id));
        if (r.companyRanking?.ordered_student_ids) setOrder(r.companyRanking.ordered_student_ids);
        if (r.companyRanking?.scores) setScores(r.companyRanking.scores);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postingId]);

  function handleDragEnd(event) {
    const { active: a, over } = event;
    if (over && a.id !== over.id) {
      setOrder(o => arrayMove(o, o.indexOf(a.id), o.indexOf(over.id)));
    }
  }

  function moveUp(idx) { setOrder(o => { const n=[...o]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; return n; }); }
  function moveDown(idx) { setOrder(o => { const n=[...o]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; }); }

  async function submit() {
    setSaving(true);
    try {
      await api.submitCompanyRanking(postingId, {
        ordered_student_ids: order,
        scores: Object.keys(scores).length > 0 ? scores : null,
      });
      toast.success('Final ranking submitted.');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const orderedStudents = order.map(id => students.find(s => s.id === id)).filter(Boolean);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>
        <Link to={`/company/applicants/${postingId}`} style={{ color: 'var(--color-primary-600)' }}>← Applicants</Link>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 className="page-title">Interviews &amp; Final Ranking</h1>
        {active && !locked && <Button onClick={submit} loading={saving}>Submit final ranking</Button>}
      </div>

      {!active && !locked && (
        <Banner variant="info" style={{ marginBottom: 'var(--space-5)' }}>
          Final rankings can be submitted during the <strong>Interviewing</strong> and <strong>Company Ranking</strong> phases.
        </Banner>
      )}
      {locked && (
        <Banner variant="warning" style={{ marginBottom: 'var(--space-5)' }}>
          Company rankings are locked. Shown in read-only mode.
        </Banner>
      )}

      {orderedStudents.length === 0 ? (
        <EmptyState title="No shortlisted students" message="Shortlist candidates from the Applicants page first." action={<Button as={Link} to={`/company/applicants/${postingId}`} variant="secondary">Go to applicants</Button>} />
      ) : (
        <>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
            Drag to reorder, set a 1–10 score, and add interview notes. Your top-ranked student is #1.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {orderedStudents.map((s, i) => (
                <SortableStudent key={s.id} student={s} index={i} total={order.length}
                  onUp={moveUp} onDown={moveDown}
                  score={scores[s.id]} onScore={(id, v) => setScores(sc => ({ ...sc, [id]: v }))}
                  notes={notes[s.id]} onNotes={(id, v) => setNotes(n => ({ ...n, [id]: v }))}
                  locked={locked || !active}
                />
              ))}
            </SortableContext>
          </DndContext>

          {active && !locked && (
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={submit} loading={saving}>Submit final ranking</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
