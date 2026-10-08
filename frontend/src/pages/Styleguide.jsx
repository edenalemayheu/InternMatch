/**
 * Styleguide — /styleguide
 * Shows every shared component in all variants.
 * Visible in both light and dark themes.
 * Not linked from the app — dev-only reference.
 */
import { useState } from 'react';
import GlassCard   from '@/components/GlassCard';
import Button      from '@/components/Button';
import Pill        from '@/components/Pill';
import Stepper     from '@/components/Stepper';
import Modal       from '@/components/Modal';
import Avatar      from '@/components/Avatar';
import PhaseBadge  from '@/components/PhaseBadge';
import EmptyState  from '@/components/EmptyState';
import Skeleton    from '@/components/Skeleton';
import { useToastContext } from '@/components/Toast';
import Blobs from '@/components/Blobs';

const PHASES = [
  'ranking_open','ranking_locked','shortlisting','shortlist_locked',
  'interviewing','company_ranking','company_locked','matched','revealed',
];

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
        fontWeight: 700, color: 'var(--color-ink)',
        borderBottom: '2px solid var(--color-primary)',
        paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-6)',
      }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginBottom: 'var(--space-2)', fontFamily: 'monospace' }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

export default function Styleguide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState('ranking_open');
  const { toast } = useToastContext();

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      <Blobs variant="slow" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: 'var(--space-16) var(--space-6)' }}>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-5xl)', fontWeight: 800, marginBottom: 'var(--space-2)', color: 'var(--color-ink)' }}>
          Intern<span style={{ color: 'var(--color-primary)' }}>Match</span> Styleguide
        </h1>
        <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-16)', fontSize: 'var(--text-lg)' }}>
          Every shared component in all variants. Toggle dark mode in the navbar.
        </p>

        {/* ── Colors ─────────────────────────────────────────────────── */}
        <Section title="Color Tokens">
          {[
            ['--color-blob-yellow','#FFD23F'],['--color-blob-blue','#2B4BFF'],
            ['--color-blob-coral','#FF6B5E'],['--color-blob-violet','#8B5CFF'],
            ['--color-primary','primary'],['--color-accent','accent'],
            ['--color-danger','danger'],['--color-warning','warning'],
            ['--color-ground','ground'],['--color-ink','ink'],['--color-ink-2','ink-2'],['--color-ink-3','ink-3'],
          ].map(([token]) => (
            <div key={token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: `var(${token})`, border: '1px solid var(--color-border)' }} />
              <span style={{ fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'monospace', maxWidth: 80, textAlign: 'center', wordBreak: 'break-all' }}>{token}</span>
            </div>
          ))}
        </Section>

        {/* ── Typography ─────────────────────────────────────────────── */}
        <Section title="Typography">
          {[['var(--text-6xl)','Heading 6xl — Bricolage Grotesque'],
            ['var(--text-4xl)','Heading 4xl — Ranked Preferences'],
            ['var(--text-2xl)','Heading 2xl — Fair Outcomes'],
            ['var(--text-xl)','Heading xl — Section title'],
            ['var(--text-base)','Base body text — DM Sans regular 16px'],
            ['var(--text-sm)','Small text — captions, meta'],
            ['var(--text-xs)','XS — badges, timestamps'],
          ].map(([size, text]) => (
            <p key={size} style={{ fontFamily: size.includes('xl') || size.includes('2xl') || size.includes('4xl') || size.includes('6xl') ? 'var(--font-heading)' : 'var(--font-body)', fontSize: size, fontWeight: size.includes('4xl') || size.includes('6xl') ? 800 : size.includes('2xl') || size.includes('xl') ? 700 : 400, color: 'var(--color-ink)', margin: 0, lineHeight: 1.3 }}>
              {text}
            </p>
          ))}
          <p style={{ fontFamily: 'var(--font-accent)', fontSize: 'var(--text-2xl)', color: 'var(--color-blob-violet)' }}>Caveat — handwritten accent</p>
        </Section>

        {/* ── GlassCard ──────────────────────────────────────────────── */}
        <Section title="GlassCard">
          <Row label="default (58% opacity)">
            <GlassCard style={{ minWidth: 220 }}>
              <p style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Default glass card</p>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)', marginTop: 4 }}>backdrop-filter: blur(24px) saturate(190%)</p>
            </GlassCard>
          </Row>
          <Row label="opaque (85%) — for tables / admin">
            <GlassCard opaque style={{ minWidth: 220 }}>
              <p style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Opaque glass card</p>
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)', marginTop: 4 }}>Higher contrast for data-dense surfaces</p>
            </GlassCard>
          </Row>
          <Row label="sm radius (20px)">
            <GlassCard radius="sm" style={{ minWidth: 220 }}>
              <p style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Small radius card</p>
            </GlassCard>
          </Row>
        </Section>

        {/* ── Buttons ────────────────────────────────────────────────── */}
        <Section title="Button">
          {[['primary','primary'],['secondary','secondary'],['ghost','ghost'],['danger','danger'],['accent','accent']].map(([v, label]) => (
            <Row key={v} label={`variant="${v}"`}>
              <Button variant={v} size="sm">{label} sm</Button>
              <Button variant={v} size="md">{label} md</Button>
              <Button variant={v} size="lg">{label} lg</Button>
              <Button variant={v} size="md" loading>loading</Button>
              <Button variant={v} size="md" disabled>disabled</Button>
            </Row>
          ))}
        </Section>

        {/* ── Pills ──────────────────────────────────────────────────── */}
        <Section title="Pill">
          <Row label="all variants">
            {['skill','phase','pending','shortlisted','rejected','matched','neutral'].map(v => (
              <Pill key={v} variant={v}>{v}</Pill>
            ))}
          </Row>
          <Row label="removable">
            <Pill variant="skill" removable onRemove={() => {}}>React</Pill>
            <Pill variant="skill" removable onRemove={() => {}}>Node.js</Pill>
          </Row>
        </Section>

        {/* ── PhaseBadge ─────────────────────────────────────────────── */}
        <Section title="PhaseBadge">
          <Row label="all phases — size='md'">
            {PHASES.map(p => <PhaseBadge key={p} phase={p} size="md" />)}
          </Row>
          <Row label="size='sm'">
            {PHASES.map(p => <PhaseBadge key={p} phase={p} size="sm" />)}
          </Row>
        </Section>

        {/* ── Stepper ────────────────────────────────────────────────── */}
        <Section title="Stepper">
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {PHASES.map(p => (
                <button key={p} onClick={() => setPhase(p)} className={`btn btn--${phase === p ? 'primary' : 'ghost'} btn--sm`}>{p}</button>
              ))}
            </div>
            <GlassCard padding="var(--space-6)">
              <Stepper currentPhase={phase} />
            </GlassCard>
          </div>
          <Row label="compact (for Navbar)">
            <GlassCard padding="var(--space-4)" style={{ width: '100%' }}>
              <Stepper currentPhase={phase} compact />
            </GlassCard>
          </Row>
        </Section>

        {/* ── Avatar ─────────────────────────────────────────────────── */}
        <Section title="Avatar">
          <Row label="all sizes">
            {['sm','md','lg','xl'].map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Avatar name="Eden Alemayehu" size={s} />
                <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>{s}</span>
              </div>
            ))}
          </Row>
          <Row label="different names (colour derived from name hash)">
            {['Alice Johnson','Bob Chen','Clara Osei','David Kim','Eva Nakamura','Frank Obi'].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Avatar name={n} size="md" />
                <span style={{ fontSize: 10, color: 'var(--color-ink-3)', textAlign: 'center', maxWidth: 60 }}>{n.split(' ')[0]}</span>
              </div>
            ))}
          </Row>
        </Section>

        {/* ── Skeleton ───────────────────────────────────────────────── */}
        <Section title="Skeleton">
          <Row label="rows">
            <div style={{ width: '100%', maxWidth: 480 }}>
              <Skeleton count={4} height="1.1em" />
            </div>
          </Row>
          <Row label="card compound">
            <div style={{ width: '100%', maxWidth: 340 }}>
              <Skeleton.Card />
            </div>
          </Row>
          <Row label="avatar circle">
            <Skeleton width="56px" height="56px" radius="50%" />
          </Row>
        </Section>

        {/* ── EmptyState ─────────────────────────────────────────────── */}
        <Section title="EmptyState">
          <GlassCard>
            <EmptyState
              title="No postings yet"
              message="Companies haven't posted any openings for this round yet. Check back soon."
              action={<Button variant="primary" size="md">Browse anyway</Button>}
            />
          </GlassCard>
        </Section>

        {/* ── Modal ──────────────────────────────────────────────────── */}
        <Section title="Modal">
          <Row label="glass modal with focus trap + ESC">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          </Row>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal" size="md">
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-6)' }}>
              This modal uses a React portal, traps focus, closes on ESC, and locks body scroll.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
        </Section>

        {/* ── Toast ──────────────────────────────────────────────────── */}
        <Section title="Toast">
          <Row label="trigger all types">
            <Button variant="accent"   size="sm" onClick={() => toast.success('Ranking submitted successfully!')}>success</Button>
            <Button variant="danger"   size="sm" onClick={() => toast.error('Something went wrong. Please try again.')}>error</Button>
            <Button variant="ghost"    size="sm" onClick={() => toast.warning('Rankings close in 2 hours.')}>warning</Button>
            <Button variant="secondary" size="sm" onClick={() => toast.info('Phase advanced to Shortlisting.')}>info</Button>
          </Row>
        </Section>

        {/* ── Form controls ──────────────────────────────────────────── */}
        <Section title="Form Controls">
          <GlassCard opaque style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="sg-name">Full name</label>
                <input id="sg-name" className="form-input" placeholder="Eden Alemayehu" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sg-dept">Department</label>
                <select id="sg-dept" className="form-select">
                  <option>Computer Science</option>
                  <option>Engineering</option>
                  <option>Business</option>
                </select>
                <span className="form-hint">Select the department that best fits your studies.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sg-err">Portfolio URL (error state)</label>
                <input id="sg-err" className="form-input form-input--error" placeholder="https://…" value="not-a-url" readOnly />
                <span className="form-error">Please enter a valid URL starting with https://</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sg-notes">Notes</label>
                <textarea id="sg-notes" className="form-textarea" placeholder="Any additional context…" rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save profile</Button>
              </div>
            </div>
          </GlassCard>
        </Section>

        {/* ── Data table ─────────────────────────────────────────────── */}
        <Section title="Data Table">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Department</th><th>Skills</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Alice Johnson','Computer Science',['React','Node.js'],'shortlisted'],
                  ['Bob Chen','Engineering',['Python','ML'],'pending'],
                  ['Clara Osei','Business',['Marketing','Excel'],'rejected'],
                ].map(([name, dept, skills, status]) => (
                  <tr key={name}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Avatar name={name} size="sm" />{name}</div></td>
                    <td style={{ color: 'var(--color-ink-2)' }}>{dept}</td>
                    <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{skills.map(s => <Pill key={s} variant="skill">{s}</Pill>)}</div></td>
                    <td><Pill variant={status}>{status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Blob variants ──────────────────────────────────────────── */}
        <Section title="Blob Variants">
          <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>
            The background blobs on this page are running at <code style={{ background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 4 }}>variant="slow"</code>.
            Landing page and dashboards use <code style={{ background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 4 }}>variant="animated"</code> (12s).
            Data-dense pages use <code style={{ background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 4 }}>variant="slow"</code> (30s).
          </p>
        </Section>

      </div>
    </div>
  );
}
