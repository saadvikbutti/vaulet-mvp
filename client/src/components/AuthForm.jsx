import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { InlineMessage } from "./Feedback.jsx";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { logIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) await signUp(form);
      else await logIn({ email: form.email, password: form.password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (issue) {
      setError(issue.message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">{isSignup ? "Start with your people" : "Your place is waiting"}</p>
      <h2 className="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
      <p className="auth-intro">{isSignup ? "Make a shared wallet for the things you’ll do together." : "Log in to pick up where the group left off."}</p>
      <form className="form-stack" onSubmit={submit}>
        {isSignup && <label className="field"><span>Your name</span><input name="name" autoComplete="name" value={form.name} onChange={update} maxLength={80} required /></label>}
        <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" value={form.email} onChange={update} maxLength={254} required /></label>
        <label className="field"><span>Password</span><input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={form.password} onChange={update} minLength={isSignup ? 8 : 1} maxLength={128} required /><small>{isSignup ? "At least 8 characters." : "Your password is private and never shown to other members."}</small></label>
        <InlineMessage message={error} />
        <button className="button button-primary button-full" disabled={submitting}>{submitting ? "One moment…" : isSignup ? "Create account" : "Log in"}<span aria-hidden="true">↗</span></button>
      </form>
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to Vaulet?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link></p>
    </div>
  );
}
