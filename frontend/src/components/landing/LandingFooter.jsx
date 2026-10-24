/** LandingFooter: author, GitHub link and license, per pages.md. No admin link. */
export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__inner">
        <div>
          <p className="lp-logo lp-logo--footer">Intern<span>Match</span></p>
          <p className="lp-footer__tag">Fair Chances. Real Fit.</p>
        </div>
        <nav aria-label="Footer" className="lp-footer__links">
          <a href="#round">The round</a>
          <a href="#why">Why ranking</a>
          <a href="#score">The score</a>
          <a href="https://github.com/edenalemayheu/InternMatch" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
        <p className="lp-footer__meta">Designed and built by Eden Alemayehu. MIT License.</p>
      </div>
    </footer>
  );
}
