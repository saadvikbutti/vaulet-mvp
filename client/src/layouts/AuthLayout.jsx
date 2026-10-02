import { Link, Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function AuthLayout() {
  return (
    <main className="auth-screen">
      <aside className="auth-story">
        <Link to="/" className="brand brand-on-dark"><span className="brand-mark">v</span><span>vaulet</span></Link>
        <div className="auth-story-copy">
          <span className="eyebrow eyebrow-light">A little more together</span>
          <h1>Make the trip.<br /><em>Keep the memories.</em></h1>
          <p>One shared wallet for the people, plans, and moments that make going places worthwhile.</p>
        </div>
        <div className="auth-story-footer"><span>Shared wallets for going places</span><span>01 — 03</span></div>
        <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" /><div className="story-sun" />
      </aside>
      <section className="auth-panel"><ThemeToggle className="auth-theme-toggle" /><div className="auth-panel-inner"><Outlet /></div><p className="auth-footnote">A calmer way to spend together.</p></section>
    </main>
  );
}
