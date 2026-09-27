import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login"); // middleware already covers this; belt & suspenders

  return (
    <div className="min-h-screen bg-paper">
      <Nav userName={user.name} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
