/**
 * Admin Data Views — /admin/data
 * Tabs: Students, Postings, Student Rankings, Company Rankings, Shortlists.
 * Searchable tables, visible in any phase.
 */
import { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import { useToastContext } from '@/components/Toast';
import * as api from '@/data/api';

const TABS = ['Students','Postings','Rankings','Co. Rankings','Shortlists'];

function Table({ cols, rows, search, searchFields }) {
  const filtered = search
    ? rows.filter(r => searchFields.some(f => String(r[f]??'').toLowerCase().includes(search.toLowerCase())))
    : rows;

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom:'2px solid var(--color-border)' }}>
            {cols.map(c=>(
              <th key={c.key} style={{ textAlign:'left', padding:'var(--space-2) var(--space-3)', color:'var(--color-ink-3)', fontWeight:600, fontSize:'var(--text-xs)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={cols.length} style={{ padding:'var(--space-8)', textAlign:'center', color:'var(--color-ink-3)' }}>No data</td></tr>
          ) : filtered.map((r,i)=>(
            <tr key={r.id ?? i} style={{ borderBottom:'1px solid var(--color-border-subtle)' }}>
              {cols.map(c=>(
                <td key={c.key} style={{ padding:'var(--space-2) var(--space-3)', color:'var(--color-ink)', verticalAlign:'middle', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.render ? c.render(r) : String(r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', padding:'var(--space-3)', textAlign:'right' }}>{filtered.length} row{filtered.length!==1?'s':''}{search && rows.length!==filtered.length ? ` of ${rows.length}` : ''}</p>
    </div>
  );
}

export default function AdminDataViews() {
  const { toast }            = useToastContext();
  const [tab,   setTab]      = useState(0);
  const [data,  setData]     = useState(null);
  const [search,setSearch]   = useState('');
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    api.getAllData().then(setData).catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  }, []);

  if(loading) return <div style={{ maxWidth:1000,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}><Skeleton count={5} height="44px" /></div>;

  const CONTENT = [
    {
      rows: data.students,
      cols: [
        { key:'id', label:'ID' },
        { key:'full_name', label:'Name' },
        { key:'department', label:'Dept.' },
        { key:'year', label:'Year' },
        { key:'skills', label:'Skills', render: r=>(r.skills??[]).join(', ') },
        { key:'portfolio_url', label:'Portfolio', render: r=>r.portfolio_url ? <a href={r.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color:'var(--color-primary)' }}>Link</a> : '—' },
      ],
      searchFields: ['full_name','department','id'],
    },
    {
      rows: data.postings,
      cols: [
        { key:'id', label:'ID' },
        { key:'title', label:'Title' },
        { key:'company_id', label:'Company' },
        { key:'required_department', label:'Dept.' },
        { key:'required_skills', label:'Skills', render: r=>(r.required_skills??[]).join(', ') },
        { key:'capacity', label:'Cap.' },
      ],
      searchFields: ['title','company_id','id'],
    },
    {
      rows: data.studentRankings,
      cols: [
        { key:'id', label:'ID' },
        { key:'student_id', label:'Student ID' },
        { key:'ordered_posting_ids', label:'Rankings', render: r=>(r.ordered_posting_ids??[]).map((id,i)=>`#${i+1}:${id}`).join(' · ') },
      ],
      searchFields: ['student_id','id'],
    },
    {
      rows: data.companyRankings,
      cols: [
        { key:'id', label:'ID' },
        { key:'posting_id', label:'Posting ID' },
        { key:'ordered_student_ids', label:'Rankings', render: r=>(r.ordered_student_ids??[]).map((id,i)=>`#${i+1}:${id}`).join(' · ') },
      ],
      searchFields: ['posting_id','id'],
    },
    {
      rows: data.shortlists,
      cols: [
        { key:'id', label:'ID' },
        { key:'posting_id', label:'Posting' },
        { key:'student_id', label:'Student' },
        { key:'shortlist_status', label:'Status' },
        { key:'interview_status', label:'Interview' },
      ],
      searchFields: ['posting_id','student_id','shortlist_status'],
    },
  ];

  const current = CONTENT[tab];

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'var(--space-8) var(--space-6)' }}>
      <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'var(--text-3xl)', fontWeight:800, color:'var(--color-ink)', marginBottom:'var(--space-6)' }}>Data Views</h1>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'var(--space-1)', marginBottom:'var(--space-5)', flexWrap:'wrap', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-lg)', padding:4, width:'fit-content' }}>
        {TABS.map((t,i)=>(
          <button key={t} type="button" onClick={()=>{ setTab(i); setSearch(''); }}
            style={{ padding:'var(--space-2) var(--space-4)', borderRadius:'var(--radius-md)', border:'none', cursor:'pointer', fontSize:'var(--text-sm)', fontWeight:600, background:tab===i?'var(--color-primary)':'transparent', color:tab===i?'white':'var(--color-ink-2)', transition:'all var(--transition-fast)', minHeight:'36px' }}>
            {t}
          </button>
        ))}
      </div>

      <GlassCard opaque radius="sm" padding="0" style={{ overflow:'hidden' }}>
        <div style={{ padding:'var(--space-4) var(--space-5)', borderBottom:'1px solid var(--color-border-subtle)' }}>
          <input type="search" className="form-input" placeholder={`Search ${TABS[tab]}…`} value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:320 }} />
        </div>
        <Table cols={current.cols} rows={current.rows} search={search} searchFields={current.searchFields} />
      </GlassCard>
    </div>
  );
}
