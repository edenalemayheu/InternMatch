/**
 * DemoPanel — floating control panel (only when VITE_USE_MOCK=true).
 * Features:
 *  - Phase switcher (jump to any of 9 phases)
 *  - Scenario presets (fresh / mid / matchday)
 *  - Switch user quick buttons
 *  - Reset demo data
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useRound, PHASE_SEQUENCE, PHASE_LABELS } from '../context/RoundContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../lib/apiClient.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const QUICK_USERS = [
  { id: 'u-admin', label: 'Admin',      route: '/admin' },
  { id: 'u-s1',    label: 'Student A',  route: '/dashboard' },
  { id: 'u-s2',    label: 'Student B',  route: '/dashboard' },
  { id: 'u-s3',    label: 'Student C',  route: '/dashboard' },
  { id: 'u-c1',    label: 'Company A',  route: '/dashboard' },
  { id: 'u-c2',    label: 'Company B',  route: '/dashboard' },
];

export default function DemoPanel() {
  const [open,    setOpen]    = useState(false);
  const [busy,    setBusy]    = useState(false);
  const { round, refresh }    = useRound();
  const { refreshUser }       = useAuth();
  const navigate              = useNavigate();

  if (!USE_MOCK) return null;

  async function jumpToPhase(targetPhase) {
    setBusy(true);
    try {
      // Use the apiClient's loadPreset + then directly call advancePhase in a loop
      // by leveraging apiClient's quickLogin flow to keep mock isolation
      const { updateDb, applyPhaseTransitionSideEffects, PHASE_SEQUENCE: PS } = await import('../lib/mock/mockDb.js');
      updateDb(db => {
        const currentIdx = PS.indexOf(db.round.phase);
        const targetIdx  = PS.indexOf(targetPhase);
        if (targetIdx < 0) return db;
        if (targetIdx <= currentIdx) {
          db.round.phase = targetPhase;
          return db;
        }
        for (let i = currentIdx + 1; i <= targetIdx; i++) {
          db.round.phase = PS[i];
          db = applyPhaseTransitionSideEffects(db, PS[i]);
        }
        return db;
      });
      await refresh();
    } catch (e) { console.error(e); }
    setBusy(false);
  }

  async function loadPreset(preset) {
    setBusy(true);
    try {
      await api.loadPreset(preset);
      await refresh();
      await refreshUser();
    } catch (e) { console.error(e); }
    setBusy(false);
  }

  async function switchUser(userId, route) {
    setBusy(true);
    try {
      const { user } = await api.quickLogin(userId);
      await refreshUser();
      navigate(route);
    } catch (e) { console.error(e); }
    setBusy(false);
  }

  async function resetDemo() {
    setBusy(true);
    try {
      await api.seed();
      await refresh();
      await refreshUser();
      navigate('/');
    } catch (e) { console.error(e); }
    setBusy(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 'var(--z-demo)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {open ? (
        <div style={{
          background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)',
          borderRadius: 10, padding: 16, width: 260,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Demo Panel</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronDown size={16} /></button>
          </div>

          {/* Current phase */}
          <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginBottom: 4 }}>CURRENT PHASE</p>
          <p style={{ color: 'var(--color-primary-300)', fontWeight: 600, marginBottom: 10 }}>{PHASE_LABELS[round?.phase] || '...'}</p>

          {/* Phase switcher */}
          <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginBottom: 6 }}>JUMP TO PHASE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
            {PHASE_SEQUENCE.map(phase => (
              <button key={phase} onClick={() => jumpToPhase(phase)} disabled={busy}
                style={{
                  textAlign: 'left', background: round?.phase === phase ? 'var(--color-primary-600)' : 'rgba(255,255,255,0.08)',
                  color: '#fff', border: 'none', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 11,
                }}>
                {PHASE_LABELS[phase]}
              </button>
            ))}
          </div>

          {/* Presets */}
          <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginBottom: 6 }}>SCENARIO PRESETS</p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['fresh', 'mid', 'matchday'].map(p => (
              <button key={p} onClick={() => loadPreset(p)} disabled={busy}
                style={{ flex: 1, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 4px', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                {p === 'fresh' ? 'Fresh' : p === 'mid' ? 'Mid-round' : 'Match Day'}
              </button>
            ))}
          </div>

          {/* Switch user */}
          <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginBottom: 6 }}>SWITCH USER</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
            {QUICK_USERS.map(u => (
              <button key={u.id} onClick={() => switchUser(u.id, u.route)} disabled={busy}
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                {u.label}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button onClick={resetDemo} disabled={busy}
            style={{ width: '100%', background: 'var(--color-error-500)', color: '#fff', border: 'none', borderRadius: 5, padding: '7px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            Reset Demo Data
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          style={{
            background: 'var(--color-neutral-900)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
          <Settings size={14} />
          Demo
          <ChevronUp size={12} />
        </button>
      )}
    </div>
  );
}
