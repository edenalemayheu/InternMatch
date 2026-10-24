/**
 * Profile — /profile
 * Edit your own profile (student or company). Not phase-restricted.
 * Student: full_name, department, year, skills, portfolio_url, availability.
 * Company: company_name, industry, contact_person, logo_url.
 * Account email is shown read-only: it is the student's contact_email and is
 * never editable here (backend also ignores it).
 * Saves via PATCH /students/me or /companies/me through apiClient.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as api from '../lib/apiClient.js';
import { DEPTS, YEARS, AVAIL, INDUSTRIES } from '../lib/profileOptions.js';
import Card     from '../components/ui/Card.jsx';
import Button   from '../components/ui/Button.jsx';
import Input    from '../components/ui/Input.jsx';
import Select   from '../components/ui/Select.jsx';
import TagInput from '../components/ui/TagInput.jsx';
import Banner   from '../components/ui/Banner.jsx';
import Spinner  from '../components/ui/Spinner.jsx';

const EMPTY_STUDENT = { full_name: '', department: '', year: '', skills: [], portfolio_url: '', availability: '' };
const EMPTY_COMPANY = { company_name: '', industry: '', contact_person: '', logo_url: '' };

/** Pick only the editable fields from a profile record, with null → ''. */
function toForm(record, empty) {
  const f = { ...empty };
  for (const k of Object.keys(empty)) {
    const v = record?.[k];
    f[k] = v == null ? empty[k] : v;
  }
  return f;
}

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === 'student';
  const empty = isStudent ? EMPTY_STUDENT : EMPTY_COMPANY;

  const [form,     setForm]     = useState(empty);
  const [baseline, setBaseline] = useState(empty);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user || user.is_admin) return;
    let cancelled = false;
    const load = isStudent ? api.getMyStudentProfile() : api.getMyCompanyProfile();
    load
      .then(res => {
        if (cancelled) return;
        const f = toForm(isStudent ? res.student : res.company, empty);
        setForm(f);
        setBaseline(f);
      })
      .catch(err => !cancelled && setLoadError(err.message || 'Could not load your profile.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user?.id]);

  if (user?.is_admin) return <Navigate to="/admin" replace />;

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); }

  function validate() {
    const errs = {};
    if (isStudent) {
      if (!form.full_name.trim()) errs.full_name = 'Required';
      if (!form.department)       errs.department = 'Required';
      if (!form.year)             errs.year = 'Required';
      if (form.skills.length < 1) errs.skills = 'Add at least one skill';
      if (!form.availability)     errs.availability = 'Required';
    } else {
      if (!form.company_name.trim())    errs.company_name = 'Required';
      if (!form.industry)               errs.industry = 'Required';
      if (!form.contact_person.trim())  errs.contact_person = 'Required';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Send only what changed (PATCH = partial update), trimmed, empty URLs as null
    const payload = {};
    for (const k of Object.keys(form)) {
      if (JSON.stringify(form[k]) === JSON.stringify(baseline[k])) continue;
      const v = form[k];
      payload[k] = typeof v === 'string'
        ? (k.endsWith('_url') ? (v.trim() || null) : v.trim())
        : v;
    }

    setSaving(true);
    try {
      const res = isStudent
        ? await api.updateStudentProfile(payload)
        : await api.updateCompanyProfile(payload);
      const saved = toForm(isStudent ? res.student : res.company, empty);
      // If the backend returned nothing usable, fall back to what we sent
      const next = (isStudent ? res.student : res.company) ? saved : { ...form };
      setForm(next);
      setBaseline(next);
      toast.success('Profile updated.');
    } catch (err) {
      // Backend validation errors: 400 { error, fields? }
      if (err.data?.fields) setErrors(err.data.fields);
      toast.error(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner /></div>;
  }
  if (loadError) {
    return <Banner variant="error">{loadError}</Banner>;
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-8) 0', fontFamily: "'Inter', sans-serif" }}>
      <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>
        {isStudent ? 'Your profile' : 'Company profile'}
      </h1>
      <p className="page-subtitle">
        {isStudent
          ? 'Companies review this profile when you rank their postings. Your department and skills also decide which postings are shown as relevant to you.'
          : 'Students see your company name and contact person on postings and in match results.'}
      </p>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {isStudent ? (
            <>
              <Input label="Full name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} error={errors.full_name} />
              <div className="grid-2">
                <Select label="Department *" value={form.department} onChange={e => set('department', e.target.value)} options={DEPTS} placeholder="Select..." error={errors.department} />
                <Select label="Year *" value={form.year} onChange={e => set('year', e.target.value)} options={YEARS} placeholder="Select..." error={errors.year} />
              </div>
              <TagInput label="Skills *" value={form.skills} onChange={v => set('skills', v)} placeholder="e.g. Python, React, SQL" error={errors.skills} />
              <Input label="Portfolio URL (optional)" type="url" value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" error={errors.portfolio_url} />
              <Select label="Availability *" value={form.availability} onChange={e => set('availability', e.target.value)} options={AVAIL} placeholder="Select..." error={errors.availability} />
            </>
          ) : (
            <>
              <Input label="Company name *" value={form.company_name} onChange={e => set('company_name', e.target.value)} error={errors.company_name} />
              <Select label="Industry *" value={form.industry} onChange={e => set('industry', e.target.value)} options={INDUSTRIES} placeholder="Select..." error={errors.industry} />
              <Input label="Contact person *" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} error={errors.contact_person} />
              <Input label="Logo URL (optional)" type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." error={errors.logo_url} />
            </>
          )}

          <Input
            label="Account email"
            value={user?.email || ''}
            disabled
            readOnly
            helper={isStudent
              ? 'Cannot be changed here. Companies only see it if they shortlist you.'
              : 'Cannot be changed here.'}
          />

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button type="submit" loading={saving} disabled={!dirty || saving}>Save changes</Button>
            <Button type="button" variant="secondary" disabled={!dirty || saving}
              onClick={() => { setForm(baseline); setErrors({}); }}>
              Discard
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
