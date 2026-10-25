import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Link to="/" className="brand-lockup"><div className="brand-mark">C</div><div><strong>careerflow</strong><span>JOB SEARCH, IN FOCUS</span></div></Link>
      <div className="not-found-card"><div className="not-found-icon"><Compass size={28} /></div><span className="eyebrow">PAGE NOT FOUND</span><h1>This path took a detour.</h1><p>The page you are looking for may have moved, or the address may be incomplete.</p><Link className="button button-primary" to="/"><ArrowLeft size={16} /> Back to CareerFlow</Link></div>
    </main>
  );
}
