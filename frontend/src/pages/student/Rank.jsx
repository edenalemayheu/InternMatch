/**
 * Student Ranking — /rank
 * Drag-to-reorder (dnd-kit) + up/down buttons, remove, submit.
 * Locked state with disabled button + tooltip when not ranking_open.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Trash2, ListOrdered } from 'lucide-react';
import { useRound, PHASE_LABELS } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Card     from '../../components/ui/Card.jsx';
import Banner   from '../../components/ui/Banner.jsx';
import Button   from '../../components/ui/Button.jsx';
import Spinner  from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

function SortableItem({ id, index, total, posting, companyName, onRemove, onUp, onDown, locked }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)',
        background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-200)',
        borderRadius: 8, marginBottom: 'var(--space-2)',
        boxShadow: isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}>
        {!locked && (
          <button {...attributes} {...listeners} style={{ background: 'none', border: 'none', cursor: 'grab', color: 'var(--color-neutral-400)', padding: 4 }} aria-label="Drag to reorder">
            <GripVertical size={18} />
          </button>
        )}

        <span style={{
          minWidth: 28, height: 28, borderRadius: '50%',
          background: index === 0 ? 'var(--color-primary-600)' : 'var(--color-neutral-100)',
          color: index === 0 ? '#fff' : 'var(--color-neutral-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {index + 1}
        </span>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{companyName}</p>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-neutral-900)' }}>{posting?.title}</p>
          {index === 0 && <span style={{ fontSize: 11, color: 'var(--color-primary-600)', fontWeight: 700 }}>#1 choice</span>}
        </div>

        {!locked && (
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => onUp(index)} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)', padding: 4, opacity: index === 0 ? 0.3 : 1 }} aria-label="Move up"><ChevronUp size={16} /></button>
            <button onClick={() => onDown(index)} disabled={index === total - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)', padding: 4, opacity: index === total - 1 ? 0.3 : 1 }} aria-label="Move down"><ChevronDown size={16} /></button>
            <button onClick={() => onRemove(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error-500)', padding: 4 }} aria-label="Remove"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentRank() {
  const { round } = useRound();
  const toast = useToast();
  const [order,    setOrder]   = useState([]);    // posting ids
  const [postings, setPostings] = useState({});   // id → posting
  const [companyMap, setCMap]  = useState({});
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);

  const phase  = round?.phase;
  const locked = phase && phase !== 'ranking_open';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    Promise.all([
      api.getMyRanking(),
      api.getPostings({ all: true }),
    ]).then(([rank, p]) => {
      setOrder(rank.ranking?.ordered_posting_ids || []);
      const map = {};
      for (const posting of (p.postings || [])) map[posting.id] = posting;
      setPostings(map);
    }).catch(() => {}).finally(() => setLoading(false));

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      import('../../lib/mock/seedData.js').then(m => {
        const map = {};
        for (const c of m.SEED_COMPANIES) map[c.id] = c.company_name;
        setCMap(map);
      }).catch(() => {});
    }
  }, []);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrder(items => {
        const ai = items.indexOf(active.id);
        const oi = items.indexOf(over.id);
        return arrayMove(items, ai, oi);
      });
    }
  }

  function moveUp(idx) {
    if (idx === 0) return;
    setOrder(o => { const n=[...o]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; return n; });
  }
  function moveDown(idx) {
    if (idx >= order.length - 1) return;
    setOrder(o => { const n=[...o]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; });
  }
  function remove(id) {
    setOrder(o => o.filter(x => x !== id));
  }

  async function submit() {
    setSaving(true);
    try {
      await api.saveRanking(order);
      toast.success('Ranking submitted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save ranking.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">My Ranking</h1>
          {round && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
            {round.label} · Phase: {PHASE_LABELS[phase]}
            {phase === 'ranking_open' && round.ranking_locks_at && (
              <> · Locks {new Date(round.ranking_locks_at).toLocaleDateString()}</>
            )}
          </p>}
        </div>
        {!locked && order.length > 0 && (
          <Button onClick={submit} loading={saving}>Submit ranking</Button>
        )}
      </div>

      {locked && (
        <Banner variant="warning" style={{ marginBottom: 'var(--space-5)' }}>
          Ranking is locked for this phase. Your submitted ranking is shown below.
        </Banner>
      )}

      {order.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Your ranking is empty"
          message="Browse postings and add them to your ranking."
          action={!locked && <Button as={Link} to="/postings">Browse postings</Button>}
        />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {order.map((id, idx) => (
                <SortableItem
                  key={id} id={id} index={idx} total={order.length}
                  posting={postings[id]}
                  companyName={postings[id] ? (companyMap[postings[id].company_id] || '') : ''}
                  onRemove={remove} onUp={moveUp} onDown={moveDown}
                  locked={locked}
                />
              ))}
            </SortableContext>
          </DndContext>

          {!locked && (
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Button as={Link} to="/postings" variant="secondary">Add more</Button>
              <Button onClick={submit} loading={saving}>Submit ranking</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
