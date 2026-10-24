/** JoinDoors: the two entry points, one per side of the match. */
import { Link } from 'react-router-dom';

export default function JoinDoors() {
  return (
    <section id="join" className="lp-doors" aria-labelledby="lp-doors-title">
      <div className="lp-wrap">
        <h2 id="lp-doors-title" className="lp-doors__title">Join the next round</h2>
        <div className="lp-doors__grid">
          <div className="lp-door">
            <h3>Students</h3>
            <p>Build your profile once, rank the postings you want, and see your result on Match Day.</p>
            <Link to="/signup?role=student" className="lp-btn lp-btn--white">Create student account</Link>
          </div>
          <div className="lp-door">
            <h3>Companies</h3>
            <p>Post your openings, shortlist from everyone who ranked you, then submit your final ranking after interviews.</p>
            <Link to="/signup?role=company" className="lp-btn lp-btn--ghost">Create company account</Link>
          </div>
        </div>
        <p className="lp-doors__login">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
