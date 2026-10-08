/**
 * Student Profile — /student/profile
 * Edit all profile fields, live completeness meter, save with toast.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/components/Toast';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import Pill from '@/components/Pill';
import Skeleton from '@/components/Skeleton';
import * as api from '@/data/api';

const DEPARTMENTS = ['Computer Science','Engineering','Business','Design','Mathematics','Physics','Economics','Other'];
const YEARS = ['1st year','2nd year','3rd year','4th year','Postgraduate'];
const AVAIL = ['June – August 2026','May – August 2026','June – September 2026','Full year 2026'];
const SKILL_SUGGESTIONS = ['React','Node.js','Python','TypeScript','JavaScript','SQL','Machine Learning','Figma','Docker','AWS','PostgreSQL','MongoDB','TensorFlow','GraphQL'];

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const filtered = SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s));
  function add(tag) {
    const t = tag.trim(); if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  }
  function onKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0,-1));
  }
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={e => e.currentTarget.querySelector('input')?.focus()}
        style={{ display:'flex',flexWrap:'wrap',gap:'var(--space-2)',alignItems:'center',padding:'var(--space-2) var(--space-3)',background:'var(--glass-bg-opaque)',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-md)',cursor:'text',minHeight:'44px' }}>
        {value.map(t => <Pill key={t} variant="skill" removable onRemove={() => onChange(value.filter(x=>x!==t))}>{t}</Pill>)}
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
          placeholder={value.length ? '' : 'Type a skill, press Enter'}
          style={{ border:'none',outline:'none',background:'transparent',fontSize:'var(--text-sm)',color:'var(--color-ink)',flex:1,minWidth:'120px' }} />
      </div>
      {input && filtered.length > 0 && (
        <div style={{ position:'absolute',zIndex:20,background:'var(--glass-bg-opaque)',backdropFilter:'var(--glass-blur)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-md)',maxHeight:'180px',overflowY:'auto',width:'100%',top:'calc(100% + 4px)' }}>
          {filtered.slice(0,8).map(s => (
            <button key={s} type="button" onMouseDown={()=>add(s)}
              style={{ display:'block',width:'100%',textAlign:'left',padding:'var(--space-2) var(--space-4)',background:'none',border:'none',cursor:'pointer',fontSize:'var(--text-sm)',color:'var(--color-ink)',minHeight:'44px' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--color-primary-light)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Meter({ data }) {
  const fields = [
    !!data.full_name, !!data.department, !!data.year,
    (data.skills?.length??0)>=2,
    (data.projects?.length??0)>=1,
    !!data.portfolio_url, !!data.availability
  ];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  return (
    <div style={{ marginBottom:'var(--space-6)' }}>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'var(--space-2)' }}>
        <span style={{ fontSize:'var(--text-sm)',fontWeight:600,color:'var(--color-ink-2)' }}>Profile completeness</span>
        <span style={{ fontSize:'var(--text-sm)',fontWeight:700,color: pct===100?'var(--color-accent)':'var(--color-primary)' }}>{pct}%</span>
      </div>
      <div style={{ height:6,background:'var(--color-border)',borderRadius:'var(--radius-full)',overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${pct}%`,background:pct===100?'var(--color-accent)':'var(--color-primary)',transition:'width 0.3s ease',borderRadius:'var(--radius-full)' }} />
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { currentUser } = useAuth();
  const { toast }       = useToastContext();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStudentProfile().then(r => { setForm(r.student ?? {}); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ maxWidth:640,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={5} height="56px" /></div>;

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateStudentProfile(form);
      toast.success('Profile saved.');
    } catch(err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth:640,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}>
      <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-3xl)',fontWeight:800,color:'var(--color-ink)',marginBottom:'var(--space-2)' }}>My Profile</h1>
      <p style={{ color:'var(--color-ink-2)',marginBottom:'var(--space-8)' }}>Your profile is reused every round. Keep it up to date.</p>

      <GlassCard opaque radius="sm" padding="var(--space-8)">
        <Meter data={form} />
        <form onSubmit={save}>
          <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-5)' }}>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-name">Full name</label>
              <input id="pf-name" className="form-input" value={form.full_name??''} onChange={e=>set('full_name',e.target.value)} placeholder="Amara Osei" />
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-dept">Department</label>
                <select id="pf-dept" className="form-select" value={form.department??''} onChange={e=>set('department',e.target.value)}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-year">Year</label>
                <select id="pf-year" className="form-select" value={form.year??''} onChange={e=>set('year',e.target.value)}>
                  <option value="">Select</option>
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Skills</label>
              <TagInput value={form.skills??[]} onChange={v=>set('skills',v)} />
              <span className="form-hint">Minimum 2 skills recommended</span>
            </div>

            <div className="form-group">
              <label className="form-label">Projects</label>
              <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-2)' }}>
                {(form.projects??[]).map((proj,i)=>(
                  <div key={i} style={{ display:'flex',gap:'var(--space-2)',alignItems:'center' }}>
                    <input className="form-input" value={proj} onChange={e=>{
                      const next=[...form.projects]; next[i]=e.target.value; set('projects',next);
                    }} placeholder="Built a real-time chat app with 1000+ users" style={{ flex:1 }} />
                    <button type="button" onClick={()=>set('projects',form.projects.filter((_,idx)=>idx!==i))}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-ink-3)',padding:'var(--space-2)',minHeight:'44px',minWidth:'44px',display:'flex',alignItems:'center',justifyContent:'center' }}
                      aria-label="Remove project">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={()=>set('projects',[...(form.projects??[]),'' ])} className="btn btn--ghost btn--sm" style={{ alignSelf:'flex-start' }}>
                  + Add project
                </button>
              </div>
              <span className="form-hint">Short descriptions of projects or achievements</span>
            </div>

            <div className="form-group">
              <label className="form-label">Certificates</label>
              <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-2)' }}>
                {(form.certificates??[]).map((cert,i)=>(
                  <div key={i} style={{ display:'flex',gap:'var(--space-2)',alignItems:'center' }}>
                    <input className="form-input" value={cert} onChange={e=>{
                      const next=[...form.certificates]; next[i]=e.target.value; set('certificates',next);
                    }} placeholder="AWS Cloud Practitioner" style={{ flex:1 }} />
                    <button type="button" onClick={()=>set('certificates',form.certificates.filter((_,idx)=>idx!==i))}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-ink-3)',padding:'var(--space-2)',minHeight:'44px',minWidth:'44px',display:'flex',alignItems:'center',justifyContent:'center' }}
                      aria-label="Remove certificate">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={()=>set('certificates',[...(form.certificates??[]),'' ])} className="btn btn--ghost btn--sm" style={{ alignSelf:'flex-start' }}>
                  + Add certificate
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-portfolio">Portfolio URL</label>
              <input id="pf-portfolio" type="url" className="form-input" value={form.portfolio_url??''} onChange={e=>set('portfolio_url',e.target.value)} placeholder="https://yoursite.dev" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-avail">Availability</label>
              <select id="pf-avail" className="form-select" value={form.availability??''} onChange={e=>set('availability',e.target.value)}>
                <option value="">Select</option>
                {AVAIL.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact email</label>
              <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-3)',padding:'var(--space-3) var(--space-4)',background:'var(--color-border-subtle)',borderRadius:'var(--radius-md)' }}>
                {form.contact_email ?? currentUser?.email} — shared only with companies that shortlist you
              </p>
            </div>

            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:'var(--space-2)' }}>
              <Button type="submit" variant="primary" size="md" loading={saving}>Save profile</Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
