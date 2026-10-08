/**
 * DemoGuide — floating presenter panel.
 *
 * Visible only when ?demo=1 is in the URL.
 * 13-step story with "Go" buttons that log in the right account and route
 * to the right page. Quick-login (student, company, admin) always available.
 * Reset Demo and Jump-to-Match-Day buttons in the footer.
 * No emoji anywhere.
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRound } from '@/context/RoundContext';
import * as api from '@/data/api';

/* ── Step definitions ───────────────────────────────────────────────────────── */
const DEMO_STEPS = [
  {
    id: 1, label: 'Landing page',
    hint: 'Open /?demo=1 in the browser. The demo guide (this panel) appears bottom-right.',
    goRoute: '/', goRole: null,
  },
  {
    id: 2, label: 'Sign up as a student',
    hint: 'Click "I\'m a Student" on the landing hero. Fill name, email, password.',
    goRoute: '/signup?role=student', goRole: null,
  },
  {
    id: 3, label: 'Complete student onboarding',
    hint: '3-step wizard: basic info, skills (type + Enter), portfolio URL. Click Finish.',
    goRoute: '/onboarding', goRole: 'student',
  },
  {
    id: 4, label: 'Browse postings',
    hint: 'Grid is pre-filtered by your department and skills. Toggle "Show all". Click a card to open the detail drawer.',
    goRoute: '/student/postings', goRole: 'student',
  },
  {
    id: 5, label: 'Build your ranking',
    hint: 'Add 3 postings from Browse. Go to My Ranking and drag to reorder. The side panel shows your live score.',
    goRoute: '/student/ranking', goRole: 'student',
  },
  {
    id: 6, label: 'Switch to company account',
    hint: 'Use Quick Login below to log in as NexaTech. Rankings were automatically saved.',
    goRoute: '/company', goRole: 'company',
  },
  {
    id: 7, label: 'Review applicants and shortlist',
    hint: 'Open Applicants for the Full-Stack posting. View a profile drawer, then click Shortlist.',
    goRoute: '/company/applicants', goRole: 'company',
  },
  {
    id: 8, label: 'Shortlist & interviews page',
    hint: 'Go to Shortlist. See shortlisted students with contact email. Set interview status.',
    goRoute: '/company/shortlist', goRole: 'company',
  },
  {
    id: 9, label: 'Submit final company ranking',
    hint: 'Go to Final Ranking. Drag-rank shortlisted candidates. Click "Lock ranking".',
    goRoute: '/company/final-ranking', goRole: 'company',
  },
  {
    id: 10, label: 'Switch to admin',
    hint: 'Use Quick Login below to log in as Admin. Phase is still ranking_open.',
    goRoute: '/admin', goRole: 'admin',
  },
  {
    id: 11, label: 'Auto-fill and run matching',
    hint: 'Click "Auto-fill Rankings" to fill all seed data, then "Run Matching Now". See 9 matches.',
    goRoute: '/admin', goRole: 'admin',
  },
  {
    id: 12, label: 'Advance to Revealed',
    hint: 'Click "Advance Phase" until the phase shows "Revealed". Or use "Jump to Match Day".',
    goRoute: '/admin', goRole: 'admin',
  },
  {
    id: 13, label: 'Match Day result',
    hint: 'Switch to student (Quick Login). Go to Result. Click "Reveal my result" for the 3-2-1 reveal.',
    goRoute: '/student/result', goRole: 'student',
  },
];

/* ── Quick-login accounts ────────────────────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { label: 'Student — Amara Osei',  email: 'amara.osei@demo.dev',       role: 'student' },
  { label: 'Company — NexaTech',    email: 'recruit@nexatech.demo.dev',  role: 'company' },
  { label: 'Admin',                 email: 'demo-admin@internmatch.dev', role: 'admin'   },
];

/* ── Inline SVG icons ─────────────────────────────────────────────────────────── */
function IconGuide() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────────────────── */
export default function DemoGuide() {
  const [visible, setVisible]     = useState(false);
  const [open,    setOpen]        = useState(true);
  const [step,    setStep]        = useState(1);
  const [acting,  setActing]      = useState(null); // 'go' | 'reset' | 'jump' | login-role
  const location                  = useLocation();
  const navigate                  = useNavigate();
  const { login, currentUser }    = useAuth();
  const { phase, refresh }        = useRound();

  /* Only activate when ?demo=1 */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') setVisible(true);
  }, []);

  /* Auto-advance step when route matches */
  useEffect(() => {
    if (!visible) return;
    const currentStepDef = DEMO_STEPS[step - 1];
    // Check if we've moved past where we are
    const nextMatch = DEMO_STEPS.findIndex(s =>
      s.id > step && s.goRoute && location.pathname.startsWith(s.goRoute.split('?')[0])
    );
    if (nextMatch >= 0) setStep(DEMO_STEPS[nextMatch].id);
  }, [location.pathname]);

  if (!visible) return null;

  const current = DEMO_STEPS[step - 1];
  const next    = DEMO_STEPS[step] ?? null;

  /* ── Actions ── */
  async function quickLogin(account) {
    setActing(account.role);
    try {
      const { user } = await login(account.email, 'demo1234');
      if (user.is_admin) navigate('/admin');
      else if (user.role === 'company') navigate('/company');
      else navigate('/student');
    } catch {
      // Silently ignore — user can try again
    } finally { setActing(null); }
  }

  async function goStep() {
    setActing('go');
    try {
      const stepDef = DEMO_STEPS[step - 1];
      // Log in as required role if specified and we aren't already
      if (stepDef.goRole && currentUser?.role !== stepDef.goRole && !currentUser?.is_admin) {
        const account = DEMO_ACCOUNTS.find(a => a.role === stepDef.goRole);
        if (account) await login(account.email, 'demo1234');
      }
      if (stepDef.goRoute) {
        navigate(stepDef.goRoute);
      }
      if (step < DEMO_STEPS.length) setStep(s => s + 1);
    } catch(e) {
      console.error('DemoGuide.goStep:', e);
    } finally { setActing(null); }
  }

  async function doReset() {
    setActing('reset');
    try {
      await api.resetDemo();
      refresh?.();
      navigate('/');
      setStep(1);
    } catch(e) { console.error(e); }
    finally { setActing(null); }
  }

  async function doJump() {
    setActing('jump');
    try {
      // Ensure logged in as admin
      if (!currentUser?.is_admin) {
        await login('demo-admin@internmatch.dev', 'demo1234');
      }
      await api.autoFillAndReveal();
      refresh?.();
      navigate('/admin/results');
      setStep(12);
    } catch(e) { console.error(e); }
    finally { setActing(null); }
  }

  /* ── Progress dots ── */
  function ProgressDots() {
    return (
      <div style={{ display:'flex', gap:4, justifyContent:'center', padding:'var(--space-2) 0' }}>
        {DEMO_STEPS.map(s => (
          <button key={s.id} type="button" onClick={() => setStep(s.id)} aria-label={`Go to step ${s.id}`}
            style={{ width: s.id === step ? 18 : 6, height:6, borderRadius:3, border:'none', cursor:'pointer', transition:'all 0.2s',
              background: s.id < step ? 'var(--color-accent)' : s.id === step ? 'var(--color-primary)' : 'var(--color-border)',
              padding:0 }} />
        ))}
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ position:'fixed', bottom:'var(--space-6)', right:'var(--space-6)', zIndex:'var(--z-demo)', width: open ? '300px' : '48px', transition:'width var(--transition-base)' }}>
      {open ? (
        <div style={{ background:'var(--glass-bg-opaque)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)', border:'1.5px solid var(--color-primary)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg), 0 0 24px var(--color-primary-glow)', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--space-3) var(--space-4)', background:'var(--color-primary-light)', borderBottom:'1px solid var(--color-border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
              <IconGuide />
              <span style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--color-primary)' }}>Demo Guide</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-ink-3)', minHeight:'36px', minWidth:'32px', display:'flex', alignItems:'center', justifyContent:'center' }} aria-label="Minimise demo guide">
              <IconClose />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding:'var(--space-4)' }}>
            {/* Current step */}
            <div style={{ marginBottom:'var(--space-3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-1)' }}>
                <span style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', fontWeight:600 }}>Step {step} / {DEMO_STEPS.length}</span>
                {phase && <span style={{ fontSize:'10px', color:'var(--color-primary)', fontWeight:600, padding:'1px 8px', background:'var(--color-primary-light)', borderRadius:'var(--radius-full)' }}>{phase.replace(/_/g,' ')}</span>}
              </div>
              <p style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--color-ink)', marginBottom:'var(--space-2)', lineHeight:'var(--leading-snug)' }}>{current.label}</p>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-2)', lineHeight:'1.5' }}>{current.hint}</p>
            </div>

            {/* Progress dots */}
            <ProgressDots />

            {/* Next step preview */}
            {next && (
              <div style={{ padding:'var(--space-2) var(--space-3)', background:'var(--color-border-subtle)', borderRadius:'var(--radius-sm)', fontSize:'var(--text-xs)', color:'var(--color-ink-3)', marginBottom:'var(--space-3)', display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                <IconArrowRight />
                <span>Next: {next.label}</span>
              </div>
            )}

            {/* Go + Back buttons */}
            <div style={{ display:'flex', gap:'var(--space-2)', marginBottom:'var(--space-4)' }}>
              <button type="button" onClick={() => setStep(s => Math.max(1, s-1))} className="btn btn--ghost btn--sm" style={{ flex:1 }} disabled={step === 1 || acting !== null}>Back</button>
              <button type="button" onClick={goStep} className="btn btn--primary btn--sm" style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-1)' }}
                disabled={acting !== null}>
                {acting === 'go' ? 'Going…' : 'Go'}
                {acting !== 'go' && <IconArrowRight />}
              </button>
            </div>

            {/* Quick login */}
            <div style={{ borderTop:'1px solid var(--color-border-subtle)', paddingTop:'var(--space-3)', marginBottom:'var(--space-3)' }}>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--color-ink-3)', fontWeight:600, marginBottom:'var(--space-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Quick Login</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-1)' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.role} type="button" onClick={() => quickLogin(acc)}
                    className="btn btn--ghost btn--sm"
                    style={{ justifyContent:'flex-start', fontSize:'var(--text-xs)', textAlign:'left' }}
                    disabled={acting !== null}>
                    {acting === acc.role ? 'Signing in…' : acc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Utility buttons */}
            <div style={{ display:'flex', gap:'var(--space-2)', borderTop:'1px solid var(--color-border-subtle)', paddingTop:'var(--space-3)' }}>
              <button type="button" onClick={doJump} disabled={acting !== null}
                style={{ flex:1, padding:'var(--space-1) var(--space-2)', background:'color-mix(in srgb, var(--color-blob-yellow) 15%, transparent)', border:'1px solid color-mix(in srgb, var(--color-blob-yellow) 40%, transparent)', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:'10px', fontWeight:700, color:'var(--color-blob-yellow)', minHeight:'36px', lineHeight:'1.2' }}>
                {acting === 'jump' ? 'Working…' : 'Jump to\nMatch Day'}
              </button>
              <button type="button" onClick={doReset} disabled={acting !== null}
                style={{ flex:1, padding:'var(--space-1) var(--space-2)', background:'color-mix(in srgb, var(--color-danger) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:'10px', fontWeight:700, color:'var(--color-danger)', minHeight:'36px', lineHeight:'1.2' }}>
                {acting === 'reset' ? 'Resetting…' : 'Reset\nDemo'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <button onClick={() => setOpen(true)} aria-label="Open demo guide"
          style={{ width:'48px', height:'48px', borderRadius:'var(--radius-full)', background:'var(--color-primary)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px var(--color-primary-glow)' }}>
          <IconGuide />
        </button>
      )}
    </div>
  );
}
