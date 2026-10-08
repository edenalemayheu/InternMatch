/**
 * Landing.jsx — public landing page.
 *
 * Features:
 *  - Blob parallax: blobs shift slightly on scroll (translateY fraction)
 *  - Hover spotlight: radial gradient follows mouse
 *  - Smooth scroll for in-page anchor links
 *  - prefers-reduced-motion respected (no parallax, no spotlight animation)
 *
 * Section order matches internmatch-v4.html:
 *   LandingNav → Hero → ProblemSolution → TwoSides →
 *   HowItWorks → Algorithm → Timeline → SignupDoors → LandingFooter
 */
import { useEffect, useRef, useCallback } from 'react';
import Blobs from '@/components/Blobs';
import LandingNav      from '@/components/landing/LandingNav';
import Hero            from '@/components/landing/Hero';
import ProblemSolution from '@/components/landing/ProblemSolution';
import TwoSides        from '@/components/landing/TwoSides';
import HowItWorks      from '@/components/landing/HowItWorks';
import Algorithm       from '@/components/landing/Algorithm';
import Timeline        from '@/components/landing/Timeline';
import SignupDoors     from '@/components/landing/SignupDoors';
import LandingFooter   from '@/components/landing/LandingFooter';
import styles from '@/components/landing/Landing.module.css';

export default function Landing() {
  const spotlightRef = useRef(null);
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* ── Hover spotlight ────────────────────────────────────────────────── */
  const onMouseMove = useCallback((e) => {
    if (reducedMotion.current) return;
    const el = spotlightRef.current;
    if (!el) return;
    el.style.left = `${e.clientX}px`;
    el.style.top  = `${e.clientY + window.scrollY}px`;
  }, []);

  /* ── Blob parallax on scroll ─────────────────────────────────────────── */
  useEffect(() => {
    if (reducedMotion.current) return;
    const blobs = document.querySelectorAll('[class*="blob"]');
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        blobs.forEach((b, i) => {
          const factor = i % 2 === 0 ? 0.08 : -0.05;
          b.style.transform = `translateY(${y * factor}px)`;
        });
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Smooth scroll for in-page anchors ──────────────────────────────── */
  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reducedMotion.current ? 'auto' : 'smooth', block: 'start' });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className={styles.page} onMouseMove={onMouseMove}>
      {/* Spotlight overlay */}
      {!reducedMotion.current && (
        <div ref={spotlightRef} className={styles.spotlight} aria-hidden="true" />
      )}

      {/* Animated background blobs */}
      <Blobs variant="animated" />

      <a href="#main-content" className="sr-only" style={{
        position:'absolute', left:'-9999px',
        top:'auto', width:'1px', height:'1px', overflow:'hidden',
      }}>
        Skip to main content
      </a>

      <LandingNav />

      <main id="main-content">
        <Hero />
        <ProblemSolution />
        <TwoSides />
        <HowItWorks />
        <Algorithm />
        <Timeline />
        <SignupDoors />
      </main>

      <LandingFooter />
    </div>
  );
}
