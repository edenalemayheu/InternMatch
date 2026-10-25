/**
 * Company Interviews — /company/interviews/:postingId
 * Shortlisted students only. Interview notes. Score 1-10 or drag-reorder.
 * Submit Final Ranking — only enabled in interviewing/company_ranking.
 */
import { useEffect, useRef, useState } from 'react';
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

function SortableStudent({ student, index, total, onUp, onDown, score, onScore, notes, onNotes, onNotesBlur, noteStatus, locked }) {
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
            <input type="number" min="1" max="10" value={score || ''} onChange={e => onScore(student.id, e.target.value)}
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
          {noteStatus === 'saving' && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Saving...</span>}
          {noteStatus === 'saved'  && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-success-600, #15803d)' }}>Saved</span>}
          {noteStatus === 'error'  && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--color-error-500)' }}>Not saved. Click outside the box to retry.</span>}
          <textarea
            value={notes || ''}
            onChange={e => onNotes(student.id, e.target.value)}
            onBlur={() => onNotesBlur(student.id)}
            maxLength={2000}
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
  const [noteStatus, setNoteStatus] = useState({}); // id → 'saving' | 'saved' | 'error'
  const savedNotes = useRef({});                      // last text the server has, per student
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
        const fromServer = Object.fromEntries((r.students || []).map(s => [s.id, s.notes || '']));
        savedNotes.current = { ...fromServer };
        setNotes(fromServer);
        setOrder((r.students || []).map(s => s.id));
        if (r.companyRanking?.ordered_student_ids) setOrder(r.companyRanking.ordered_student_ids);
        if (r.companyRanking?.scores) setScores(r.companyRanking.scores);
      })
      .catch(err => api.showError(toast, err, 'Could not load shortlisted students.'))
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

  // An empty box removes the score; only whole numbers from 1 to 10 are kept.
  function setScore(id, raw) {
    setScores(sc => {
      const next = { ...sc };
      const n = Number(raw);
      if (raw === '' || raw == null) delete next[id];
      else if (Number.isInteger(n) && n >= 1 && n <= 10) next[id] = n;
      return next;
    });
  }

  // Notes save when you leave the box, not on every keystroke.
  async function saveNote(id) {
    const text = notes[id] || '';
    if (text === (savedNotes.current[id] || '')) return;
    setNoteStatus(s => ({ ...s, [id]: 'saving' }));
    try {
      await api.saveInterviewNotes(postingId, id, text);
      savedNotes.current[id] = text;
      setNoteStatus(s => ({ ...s, [id]: 'saved' }));
    } catch (err) {
      setNoteStatus(s => ({ ...s, [id]: 'error' }));
      api.showError(toast, err, 'Could not save the note.');
    }
  }

  // The server accepts an order OR scores, never both. Scores are used only when
  // every shortlisted student has one; otherwise the drag order is sent.
  const allScored = students.length > 0 && students.every(s => Number.isInteger(scores[s.id]));

  async function submit() {
    setSaving(true);
    try {
      await api.submitCompanyRanking(
        postingId,
        allScored
          ? { scores: Object.fromEntries(students.map(s => [s.id, scores[s.id]])) }
          : { ordered_student_ids: order },
      );
      toast.success('Final ranking submitted.');
    } catch (err) {
      if (err.data?.fields) toast.error(Object.values(err.data.fields)[0]);
      else api.showError(toast, err, 'Could not submit your ranking.');
    }
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
            Drag to reorder, or give every student a 1–10 score. Scores are used only when every student has one; otherwise your drag order is used. Notes save when you click outside the box.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {orderedStudents.map((s, i) => (
                <SortableStudent key={s.id} student={s} index={i} total={order.length}
                  onUp={moveUp} onDown={moveDown}
                  score={scores[s.id]} onScore={setScore}
                  notes={notes[s.id]} onNotes={(id, v) => setNotes(n => ({ ...n, [id]: v }))}
                  onNotesBlur={saveNote} noteStatus={noteStatus[s.id]}
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
