import { Link } from "react-router-dom";
export default function NotFoundPage() { return <main className="not-found"><span className="eyebrow">Lost on the way</span><h1>That page isn’t here.</h1><p>Head back to your dashboard and pick up where you left off.</p><Link to="/dashboard" className="button button-primary">Go to dashboard <span>↗</span></Link></main>; }
