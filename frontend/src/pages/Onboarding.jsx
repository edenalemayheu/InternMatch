/**
 * Onboarding — /onboarding
 * Student: full_name, department, year, skills, portfolio_url, availability.
 * Company: company_name, industry, contact_person, logo_url.
 * Validates and submits via apiClient, then → /dashboard.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as api from '../lib/apiClient.js';
import Card     from '../components/ui/Card.jsx';
import Button   from '../components/ui/Button.jsx';
import Input    from '../components/ui/Input.jsx';
import Select   from '../components/ui/Select.jsx';
import TagInput from '../components/ui/TagInput.jsx';

const DEPTS  = ['Computer Science','Data Science','Business','Engineering','Environmental Science','Finance','Education','Design','Other'];
const YEARS  = ['1st year','2nd year','3rd year','4th year','Postgraduate','Other'];
const AVAIL  = ['Full-time summer','Part-time (20h/week)','Remote only','Flexible'];
const INDUSTRIES = ['Software','Data & Analytics','Cloud Infrastructure','Sustainability Tech','Fintech','Healthcare Tech','EdTech','Consulting','Other'];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const toast   = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // Student fields
    full_name:'', department:'', year:'', skills:[], portfolio_url:'', availability:'',
    // Company fields
    company_name:'', industry:'', contact_person:'', logo_url:'',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const errs = {};
    if (user?.role === 'student') {
      if (!form.full_name.trim())  errs.full_name   = 'Required';
      if (!form.department)        errs.department  = 'Required';
      if (!form.year)              errs.year        = 'Required';
      if (form.skills.length < 1)  errs.skills      = 'Add at least one skill';
      if (!form.availability)      errs.availability = 'Required';
    } else {
      if (!form.company_name.trim()) errs.company_name   = 'Required';
      if (!form.industry)            errs.industry        = 'Required';
      if (!form.contact_person.trim()) errs.contact_person = 'Required';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (user?.role === 'student') {
        await api.createStudent({
          full_name: form.full_name.trim(),
          department: form.department, year: form.year,
          skills: form.skills,
          portfolio_url: form.portfolio_url || null,
          availability: form.availability,
          contact_email: user.email,
        });
      } else {
        await api.createCompany({
          company_name: form.company_name.trim(),
          industry: form.industry,
          contact_person: form.contact_person.trim(),
          logo_url: form.logo_url || null,
        });
      }
      await refreshUser();
      toast.success('Profile created! Welcome to InternMatch.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-8) 0', fontFamily: "'Inter', sans-serif" }}>
      <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>Complete your profile</h1>
      <p className="page-subtitle">This information is used every round, so you only do this once.</p>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {user?.role === 'student' ? (
            <>
              <Input label="Full name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Amara Johnson" error={errors.full_name} />
              <div className="grid-2">
                <Select label="Department *" value={form.department} onChange={e => set('department', e.target.value)} options={DEPTS} placeholder="Select..." error={errors.department} />
                <Select label="Year *" value={form.year} onChange={e => set('year', e.target.value)} options={YEARS} placeholder="Select..." error={errors.year} />
              </div>
              <TagInput label="Skills *" value={form.skills} onChange={v => set('skills', v)} placeholder="e.g. Python, React, SQL" error={errors.skills} />
              <Input label="Portfolio URL (optional)" type="url" value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" />
              <Select label="Availability *" value={form.availability} onChange={e => set('availability', e.target.value)} options={AVAIL} placeholder="Select..." error={errors.availability} />
            </>
          ) : (
            <>
              <Input label="Company name *" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Acme Corp" error={errors.company_name} />
              <Select label="Industry *" value={form.industry} onChange={e => set('industry', e.target.value)} options={INDUSTRIES} placeholder="Select..." error={errors.industry} />
              <Input label="Contact person *" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Your name (as shown to students)" error={errors.contact_person} />
              <Input label="Logo URL (optional)" type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
            </>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            Complete profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
