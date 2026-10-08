/**
 * LandingFooter — matches v4 copy exactly.
 * InternMatch | How it works | Algorithm | Timeline | Fair Chances. Real Fit. · MIT License
 * No admin link.
 */
import styles from './Landing.module.css';

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>Intern<span>Match</span></span>
          <span className={styles.footerTagline}>Fair Chances. Real Fit.</span>
        </div>

        <nav className={styles.footerLinks} aria-label="Footer links">
          <a href="#how-it-works" className={styles.footerLink}>How it works</a>
          <a href="#algorithm"    className={styles.footerLink}>Algorithm</a>
          <a href="#timeline"     className={styles.footerLink}>Timeline</a>
          <a
            href="https://github.com/edenalemayheu/InternMatch"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            GitHub ↗
          </a>
        </nav>

        <p className={styles.footerMeta}>· MIT License</p>
      </div>
    </footer>
  );
}
