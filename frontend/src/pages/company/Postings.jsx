/**
 * Company Postings — /company/postings
 * List postings with create (modal), edit, delete (with confirm).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useRound, phaseAtLeast } from '../../context/RoundContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as api from '../../lib/apiClient.js';
import Card    from '../../components/ui/Card.jsx';
import Button  from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import Input   from '../../components/ui/Input.jsx';
import Select  from '../../components/ui/Select.jsx';
import TagInput from '../../components/ui/TagInput.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge   from '../../components/ui/Badge.jsx';

const DEPTS = ['Computer Science','Data Science','Business','Engineering','Environmental Science','Finance','Education','Design','Other',''];

export default function CompanyPostings() {
  const { round }  = useRound();
  const toast = useToast();
  const [postings, setPostings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ title: '', required_department: '', required_skills: [], capacity: 1 });
  const [errors,   setErrors]   = useState({});

  function load() {
    api.getMyPostings().then(r => setPostings(r.postings || [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', required_department: '', required_skills: [], capacity: 1 });
    setErrors({});
    setModal(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({ title: p.title, required_department: p.required_department || '', required_skills: p.required_skills || [], capacity: p.capacity || 1 });
    setErrors({});
    setModal(true);
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (form.capacity < 1 || form.capacity > 10) e.capacity = '1–10';
    return e;
  }

  async function savePosting(e) {
    e.preventDefault();
    const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (editing) await api.updatePosting(editing.id, form);
      else         await api.createPosting(form);
      setModal(false);
      toast.success(editing ? 'Posting updated.' : 'Posting created.');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await api.deletePosting(deleting.id);
      setDeleting(null);
      toast.success('Posting deleted.');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const phase = round?.phase;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title">Postings</h1>
        <Button onClick={openCreate}><Plus size={16} /> Create posting</Button>
      </div>

      {postings.length === 0 ? (
        <EmptyState icon={Plus} title="No postings yet" message="Create your first posting to start receiving applications." action={<Button onClick={openCreate}>Create posting</Button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {postings.map(p => (
            <Card key={p.id} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 'var(--space-1)' }}>{p.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-2)' }}>
                    {p.required_department || 'Any department'} · Capacity: {p.capacity}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(p.required_skills || []).map(s => <Badge key={s} variant="skill">{s}</Badge>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {phaseAtLeast(phase, 'ranking_locked') && (
                    <Button as={Link} to={`/company/applicants/${p.id}`} variant="secondary" style={{ fontSize: 'var(--text-sm)' }}>
                      <Users size={14} /> Applicants
                    </Button>
                  )}
                  <button onClick={() => openEdit(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-neutral-200)', background: 'none', cursor: 'pointer', color: 'var(--color-neutral-600)' }}><Pencil size={14} /></button>
                  <button onClick={() => setDeleting(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-error-500)', background: 'none', cursor: 'pointer', color: 'var(--color-error-500)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit posting' : 'New posting'}>
        <form onSubmit={savePosting} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Title *" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Frontend Engineer Intern" error={errors.title} />
          <Select label="Required department" value={form.required_department} onChange={e => setF('required_department', e.target.value)}
            options={DEPTS.map(d => ({ value: d, label: d || 'Any department' }))} />
          <TagInput label="Required skills" value={form.required_skills} onChange={v => setF('required_skills', v)} placeholder="e.g. React, SQL, Python" />
          <div className="input-group">
            <label className="input-label">Capacity (1–10)</label>
            <input type="number" min="1" max="10" className={`input ${errors.capacity ? 'input--error' : ''}`} value={form.capacity} onChange={e => setF('capacity', +e.target.value)} />
            {errors.capacity && <span className="input-error-text">{errors.capacity}</span>}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create posting'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete posting?"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete posting"
        loading={saving}
      />
    </div>
  );
}
