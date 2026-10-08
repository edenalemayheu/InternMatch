/**
 * Match Result — /student/result
 * Pre-reveal: countdown to June 1.
 * On revealed: 3-2-1 sequence, confetti, match card, score explanation.
 * Unmatched: kind message, ranking summary.
 * prefers-reduced-motion: no confetti, no animation sequence.
 */
import { useState, useEffect, useRef } from 'react';
import { useRound } from '@/context/RoundContext';
import { useToastContext } from '@/components/Toast';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import Skeleton from '@/components/Skeleton';
import * as api from '@/data/api';

const MATCH_DAY = new Date('2026-06-01T00:00:00');

function Countdown() {
  const [cd, setCd] = useState(() => {
    const d = MATCH_DAY - new Date(); return d>0 ? { days:Math.floor(d/864e5), hours:Math.floor((d%864e5)/36e5) } : null;
  });
  useEffect(()=>{
    const t = setInterval(()=>{
      const d=MATCH_DAY-new Date(); setCd(d>0?{days:Math.floor(d/864e5),hours:Math.floor((d%864e5)/36e5)}:null);
    },60000);
    return ()=>clearInterval(t);
  },[]);
  return cd ? (
    <p style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-5xl)',fontWeight:800,color:'var(--color-blob-yellow)' }}>{cd.days}d {cd.hours}h</p>
  ) : <p style={{ color:'var(--color-ink-2)' }}>It's Match Day!</p>;
}

export default function StudentReveal() {
  const { phase }  = useRound();
  const { toast }  = useToastContext();
  const [match,    setMatch]    = useState(undefined); // undefined = loading, null = unmatched
  const [posting,  setPosting]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [seq,      setSeq]      = useState(0); // 0=hidden, 1=3, 2=2, 3=1, 4=reveal
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (phase !== 'revealed') { setLoading(false); return; }
    api.getMatchResults()
      .then(r => {
        setMatch(r.match ?? null);
        if (r.match) {
          api.getPosting(r.match.posting_id).then(p => {
            setPosting(p.posting);
            // Enrich with company name from known seed
            const cMap = {
              'c01': 'NexaTech Software',
              'c02': 'BridgeAI',
              'c03': 'VaultFin',
              'c04': 'Studio Nova',
              'c05': 'Greenfield Analytics',
              'c06': 'OrbitUX',
            };
            setPosting(prev => ({ ...prev, company_name: cMap[prev.company_id] ?? prev.company_id }));
          }).catch(()=>{});
        }
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [phase, toast]);

  function startReveal() {
    if (reducedMotion.current) { setRevealed(true); fireConfetti(); return; }
    setSeq(1);
    const steps = [
      ()=>setSeq(2), ()=>setSeq(3),
      ()=>{ setSeq(4); setRevealed(true); fireConfetti(); },
    ];
    steps.forEach((fn,i) => setTimeout(fn, (i+1)*900));
  }

  function fireConfetti() {
    if (reducedMotion.current || !match) return;
    import('canvas-confetti').then(m => {
      const confetti = m.default;
      confetti({ particleCount:120, spread:80, origin:{y:0.6}, colors:['#FFD23F','#2B4BFF','#10B981','#8B5CFF'] });
      setTimeout(()=>confetti({ particleCount:60, spread:60, origin:{y:0.5} }), 500);
    }).catch(()=>{});
  }

  if (loading) return <div style={{ maxWidth:640,margin:'0 auto',padding:'var(--space-16) var(--space-6)' }}><Skeleton count={3} height="100px" /></div>;

  /* Pre-reveal holding page */
  if (phase !== 'revealed') {
    return (
      <div style={{ maxWidth:560,margin:'0 auto',padding:'var(--space-16) var(--space-6)',textAlign:'center' }}>
        <GlassCard padding="var(--space-12)">
          <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-4)' }}>Match Day</p>
          <Countdown />
          <p style={{ color:'var(--color-ink-2)',marginTop:'var(--space-4)',lineHeight:'var(--leading-normal)' }}>
            Results will be revealed to everyone simultaneously on June 1, 2026.
          </p>
        </GlassCard>
      </div>
    );
  }

  /* Countdown sequence */
  if (seq > 0 && seq < 4) {
    const nums = ['','3','2','1'];
    return (
      <div style={{ height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <p style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-6xl)',fontWeight:800,color:'var(--color-primary)',animation:'fade-in var(--transition-base) both' }} key={seq}>
          {nums[seq]}
        </p>
      </div>
    );
  }

  /* Unrevealed trigger button */
  if (!revealed && phase === 'revealed') {
    return (
      <div style={{ maxWidth:560,margin:'0 auto',padding:'var(--space-16) var(--space-6)',textAlign:'center' }}>
        <GlassCard padding="var(--space-12)">
          <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-4xl)',fontWeight:800,color:'var(--color-ink)',marginBottom:'var(--space-4)' }}>
            It's Match Day
          </h1>
          <p style={{ color:'var(--color-ink-2)',marginBottom:'var(--space-8)',lineHeight:'var(--leading-normal)' }}>
            Your result is ready. Are you ready to see it?
          </p>
          <Button variant="accent" size="lg" onClick={startReveal} style={{ minWidth:'200px' }}>
            Reveal my result
          </Button>
        </GlassCard>
      </div>
    );
  }

  /* Matched result */
  if (match) {
    return (
      <div style={{ maxWidth:640,margin:'0 auto',padding:'var(--space-8) var(--space-6)',animation:'fade-in var(--transition-slow) both' }}>
        <div style={{ textAlign:'center',marginBottom:'var(--space-8)' }}>
          <p style={{ fontFamily:'var(--font-accent)',fontSize:'var(--text-3xl)',color:'var(--color-blob-yellow)',fontWeight:600,marginBottom:'var(--space-2)' }}>Congratulations!</p>
          <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-4xl)',fontWeight:800,color:'var(--color-ink)' }}>You've been matched!</h1>
        </div>

        <GlassCard padding="var(--space-8)" style={{ marginBottom:'var(--space-5)',border:'2px solid var(--color-accent)',boxShadow:'0 0 32px rgba(16,185,129,0.2)' }}>
          {posting && (
            <>
              <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-2)' }}>Your match</p>
              <h2 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-2xl)',fontWeight:700,color:'var(--color-ink)',marginBottom:'var(--space-1)' }}>{posting.title}</h2>
              <p style={{ color:'var(--color-ink-2)',marginBottom:'var(--space-5)' }}>{posting.company_name ?? posting.company_id}</p>
            </>
          )}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'var(--space-4)',background:'var(--color-accent-light)',borderRadius:'var(--radius-md)',border:'1px solid rgba(16,185,129,0.25)' }}>
            <div>
              <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)',marginBottom:4 }}>Mutual interest score</p>
              <p style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-3xl)',fontWeight:800,color:'var(--color-accent)' }}>{match.mutual_score}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)',marginBottom:4 }}>How it's calculated</p>
              <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-2)' }}>
                You ranked them #{match.student_rank}<br />
                They ranked you #{match.company_rank}
              </p>
              <p style={{ fontFamily:'monospace',fontSize:'var(--text-xs)',color:'var(--color-ink-3)',marginTop:4 }}>
                1/{match.student_rank} + 1/{match.company_rank} = {match.mutual_score}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard opaque radius="sm" padding="var(--space-5)">
          <h3 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-base)',fontWeight:700,color:'var(--color-ink)',marginBottom:'var(--space-3)' }}>What happens next</h3>
          <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-2)',lineHeight:'var(--leading-normal)' }}>
            Your match company will be in touch to confirm your start date and details.
            Your internship begins as summer break starts — congratulations!
          </p>
        </GlassCard>
      </div>
    );
  }

  /* Unmatched result */
  return (
    <div style={{ maxWidth:560,margin:'0 auto',padding:'var(--space-8) var(--space-6)',textAlign:'center',animation:'fade-in var(--transition-slow) both' }}>
      <GlassCard padding="var(--space-10)">
        <p style={{ fontSize:'var(--text-4xl)',marginBottom:'var(--space-4)',lineHeight:1 }} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>
        </p>
        <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-2xl)',fontWeight:700,color:'var(--color-ink)',marginBottom:'var(--space-3)' }}>
          Not matched this round
        </h1>
        <p style={{ color:'var(--color-ink-2)',lineHeight:'var(--leading-normal)',marginBottom:'var(--space-6)' }}>
          You weren't matched this round — you're automatically eligible for the next round.
          This isn't a reflection on your profile; sometimes mutual rankings just don't align.
        </p>
        <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink-3)' }}>
          Keep your profile up to date for the next round opening.
        </p>
      </GlassCard>
    </div>
  );
}
