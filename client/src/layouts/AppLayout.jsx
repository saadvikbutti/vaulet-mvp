import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { InlineMessage } from "../components/Feedback.jsx";
import { useState } from "react";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vaulets", label: "Your Vaulets" },
  { to: "/planner", label: "Trip planner" },
];

export default function AppLayout() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogOut() {
    setError("");
    setLoggingOut(true);
    try {
      await logOut();
      navigate("/login", { replace: true });
    } catch (issue) {
      setError(issue.message);
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink className="brand" to="/dashboard" aria-label="Vaulet dashboard">
            <span className="brand-mark">v</span><span>vaulet</span>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="account-menu">
            <NavLink to="/profile" className="user-chip" title="View your profile">
              <span className="avatar-small">{user?.name?.slice(0, 1)?.toUpperCase() || "V"}</span>
              <span className="user-chip-name">{user?.name || "Your profile"}</span>
            </NavLink>
            <button className="button button-quiet button-small" onClick={handleLogOut} disabled={loggingOut}>
              {loggingOut ? "Leaving…" : "Log out"}
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        {error && <InlineMessage message={error} />}
        <Outlet />
      </main>
      <footer className="site-footer"><span>Good trips are better shared.</span><span>Vaulet · Shared wallets for going places</span></footer>
    </div>
  );
}
