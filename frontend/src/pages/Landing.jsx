/**
 * Landing: public landing page ("/").
 * Order: nav, hero (live match demo), round timeline, why ranking,
 * the score, join. Light/dark applies to this page only.
 * Styles live in components/landing/landing.css (all classes start with lp-).
 */
import { useEffect } from 'react';
import '@/components/landing/landing.css';
import { useLandingTheme, prefersReducedMotion } from '@/components/landing/useLandingTheme';
import LandingNav     from '@/components/landing/LandingNav';
import Hero           from '@/components/landing/Hero';
import RoundTimeline  from '@/components/landing/RoundTimeline';
import Contrast       from '@/components/landing/Contrast';
import ScoreExplainer from '@/components/landing/ScoreExplainer';
import JoinDoors      from '@/components/landing/JoinDoors';
import LandingFooter  from '@/components/landing/LandingFooter';

export default function Landing() {
  const [theme, toggleTheme] = useLandingTheme();

  /* Smooth in-page scrolling for the nav anchors, unless the user prefers less motion. */
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    return () => { el.style.scrollBehavior = prev; };
  }, []);

  return (
    <div className="lp-root" data-theme={theme}>
      <a href="#main" className="lp-skip">Skip to main content</a>
      <LandingNav theme={theme} onToggleTheme={toggleTheme} />
      <main id="main">
        <Hero />
        <RoundTimeline />
        <Contrast />
        <ScoreExplainer />
        <JoinDoors />
      </main>
      <LandingFooter />
    </div>
  );
}
