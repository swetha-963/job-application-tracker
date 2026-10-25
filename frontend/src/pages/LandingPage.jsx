import { ArrowRight, BarChart3, Briefcase, CalendarCheck2, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Briefcase, title: "Every application, in one place", text: "Keep role details, recruiters, status, and follow-ups together." },
  { icon: CalendarCheck2, title: "Show up prepared", text: "Plan interviews and reminders around the opportunities that matter." },
  { icon: BarChart3, title: "See the shape of your search", text: "Understand your progress with live application and conversion insights." },
  { icon: FileText, title: "Keep your CV close", text: "Organize private resume copies and connect them to applications." },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand-lockup">
          <div className="brand-mark">C</div>
          <div><strong>careerflow</strong><span>JOB SEARCH, IN FOCUS</span></div>
        </Link>
        <div className="landing-nav-actions">
          <Link className="landing-sign-in" to="/login">Sign in</Link>
          <Link className="button button-primary" to="/register">Get started <ArrowRight size={16} /></Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="pulse-dot" /> A calmer way to job search</div>
          <h1>Make your next move <em>with a little more clarity.</em></h1>
          <p>CareerFlow keeps your applications, interviews, follow-ups, and career notes moving in the same direction.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/register">Build your workspace <ArrowRight size={18} /></Link>
            <Link className="button button-soft button-large" to="/login">I already have an account</Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={17} /> Your job search data stays in your private workspace.</div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-dash-card">
            <div className="preview-topline"><span>YOUR JOB SEARCH</span><span className="preview-live"><span /> LIVE</span></div>
            <div className="preview-title">A little progress, every day.</div>
            <div className="preview-stat-row">
              <div><span>Applications</span><strong>24</strong><small>+4 this month</small></div>
              <div><span>Interviews</span><strong>06</strong><small>2 coming up</small></div>
            </div>
            <div className="preview-chart">
              <div className="preview-chart-head"><span>Application activity</span><span>Last 6 months</span></div>
              <div className="preview-bars">
                {[28, 41, 36, 62, 48, 83, 67, 92, 58, 74, 86, 100].map((height, index) => <i key={index} style={{ height: height + "%" }} />)}
              </div>
              <div className="preview-months"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div>
            </div>
            <div className="preview-application">
              <div className="preview-company-mark">N</div>
              <div><strong>Product Engineer</strong><span>Northstar Labs</span></div>
              <span className="status-badge status-interview">Interview</span>
            </div>
          </div>
          <div className="hero-float-card float-note"><Sparkles size={17} /><span>One clear next step</span></div>
          <div className="hero-float-card float-reminder"><CalendarCheck2 size={16} /><span>Follow-up, tomorrow</span></div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-section-heading">
          <p className="eyebrow">YOUR SEARCH, CONNECTED</p>
          <h2>Less juggling. More forward motion.</h2>
          <p>A practical workspace for the details behind your next opportunity.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer"><span>CareerFlow</span><span>Built for a more intentional job search.</span></footer>
    </div>
  );
}
