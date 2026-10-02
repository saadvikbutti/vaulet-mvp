import { useEffect, useState } from "react";

const KEY = "vaulet-theme";
const COLORS = { light: "#f7f2e9", dark: "#0d0c1f" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLORS[theme]);
}

function readSaved() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "light");

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (readSaved()) return;
      const next = query.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
  }

  const dark = theme === "dark";
  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      {dark ? (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>
      )}
    </button>
  );
}
