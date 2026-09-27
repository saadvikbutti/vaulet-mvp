import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vaulets", label: "Vaulets" },
  { href: "/planner", label: "Planner" },
  { href: "/profile", label: "Profile" },
];

export function Nav({ userName }: { userName: string }) {
  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="font-semibold tracking-tight text-ink">
          Vaulet
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-3 py-1.5 rounded-md text-ink/70 hover:text-ink hover:bg-black/5 transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted hidden sm:inline">{userName}</span>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm px-3 py-1.5 rounded-md border border-line hover:bg-black/5 transition">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
